using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Windows.Forms;

namespace SonicWaveApp
{
    static class Program
    {
        private static Process backendProcess = null;
        private const string PORTABLE_NODE_URL = "https://nodejs.org/dist/v20.18.1/node-v20.18.1-win-x64.zip";
        private const string PORTABLE_NODE_FOLDER = "node-v20.18.1-win-x64";

        [STAThread]
        static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            string serverDir = Path.Combine(appDir, "server");
            string serverIndex = Path.Combine(serverDir, "index.js");

            // Check parent directory if launched from a subfolder
            if (!File.Exists(serverIndex))
            {
                DirectoryInfo parent = Directory.GetParent(appDir);
                if (parent != null)
                {
                    string parentServer = Path.Combine(parent.FullName, "server", "index.js");
                    if (File.Exists(parentServer))
                    {
                        serverDir = Path.Combine(parent.FullName, "server");
                        serverIndex = parentServer;
                    }
                }
            }

            // 1. Locate bundled or installed Node.js runtime; auto-provision portable LTS if missing
            string nodePath = FindNodeExecutable(appDir);
            if (string.IsNullOrEmpty(nodePath))
            {
                nodePath = AutoProvisionPortableNode();
                if (string.IsNullOrEmpty(nodePath))
                {
                    return;
                }
            }

            // 2. Discover active SonicWave instance on 3001 or allocate a free loopback port
            int activePort = 3001;
            bool serverReady = IsSonicWaveResponding("http://127.0.0.1:3001/api/status");

            if (!serverReady && File.Exists(serverIndex))
            {
                activePort = FindAvailablePort(3001);
                EnsureDependencies(nodePath, serverDir);

                try
                {
                    string nodeDir = Path.GetDirectoryName(nodePath);
                    ProcessStartInfo psi = new ProcessStartInfo
                    {
                        FileName = nodePath,
                        Arguments = "\"" + serverIndex + "\"",
                        WorkingDirectory = serverDir,
                        CreateNoWindow = true,
                        UseShellExecute = false,
                        WindowStyle = ProcessWindowStyle.Hidden
                    };
                    psi.EnvironmentVariables["PORT"] = activePort.ToString();
                    psi.EnvironmentVariables["NODE_ENV"] = "production";
                    PrependPath(psi, nodeDir);

                    backendProcess = Process.Start(psi);
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Failed to start SonicWave backend engine: " + ex.Message, "SonicWave Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                // Poll for server readiness up to 20 seconds
                string statusUrl = "http://127.0.0.1:" + activePort + "/api/status";
                int waited = 0;
                while (waited < 20000)
                {
                    Thread.Sleep(300);
                    waited += 300;
                    if (IsSonicWaveResponding(statusUrl))
                    {
                        serverReady = true;
                        break;
                    }
                    if (backendProcess != null && backendProcess.HasExited)
                    {
                        MessageBox.Show("SonicWave backend process exited unexpectedly.", "SonicWave Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        return;
                    }
                }
            }

            // 3. Locate browser capable of Application Window Mode (--app)
            string appUrl = "http://localhost:" + activePort + "/#app";
            string edgePath = FindEdgeExecutable();
            string chromePath = FindChromeExecutable();
            string browserExe = !string.IsNullOrEmpty(edgePath) ? edgePath : chromePath;

            if (!string.IsNullOrEmpty(browserExe))
            {
                string profileDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "SonicWave", "Profile");
                if (!Directory.Exists(profileDir))
                {
                    Directory.CreateDirectory(profileDir);
                }

                string appArgs = string.Format("--app=\"{0}\" --window-size=1280,820 --user-data-dir=\"{1}\" --app-id=\"SonicWaveDesktop\" --no-first-run", appUrl, profileDir);

                ProcessStartInfo windowPsi = new ProcessStartInfo
                {
                    FileName = browserExe,
                    Arguments = appArgs,
                    UseShellExecute = false
                };

                try
                {
                    Process windowProcess = Process.Start(windowPsi);
                    if (windowProcess != null)
                    {
                        windowProcess.WaitForExit();
                    }
                }
                catch
                {
                    Process.Start(new ProcessStartInfo(appUrl) { UseShellExecute = true });
                }
            }
            else
            {
                Process.Start(new ProcessStartInfo(appUrl) { UseShellExecute = true });
            }

            ShutdownBackend();
        }

        private static void PrependPath(ProcessStartInfo psi, string dir)
        {
            if (string.IsNullOrEmpty(dir)) return;
            string current = psi.EnvironmentVariables["PATH"] ?? (Environment.GetEnvironmentVariable("PATH") ?? "");
            if (!current.ToLowerInvariant().Contains(dir.ToLowerInvariant()))
            {
                psi.EnvironmentVariables["PATH"] = dir + ";" + current;
            }
        }

        private static int FindAvailablePort(int startPort)
        {
            for (int port = startPort; port < startPort + 30; port++)
            {
                try
                {
                    TcpListener listener = new TcpListener(IPAddress.Loopback, port);
                    listener.Start();
                    listener.Stop();
                    return port;
                }
                catch {}
            }

            try
            {
                TcpListener fallback = new TcpListener(IPAddress.Loopback, 0);
                fallback.Start();
                int ephemeral = ((IPEndPoint)fallback.LocalEndpoint).Port;
                fallback.Stop();
                return ephemeral;
            }
            catch
            {
                return startPort;
            }
        }

        private static bool IsSonicWaveResponding(string url)
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url);
                req.Timeout = 1000;
                req.Method = "GET";
                using (HttpWebResponse res = (HttpWebResponse)req.GetResponse())
                {
                    if (res.StatusCode != HttpStatusCode.OK) return false;
                    using (StreamReader reader = new StreamReader(res.GetResponseStream()))
                    {
                        string body = reader.ReadToEnd();
                        return body.Contains("\"ytDlp\"") || body.Contains("\"ffmpeg\"");
                    }
                }
            }
            catch
            {
                return false;
            }
        }

        private static string FindNodeExecutable(string appDir)
        {
            string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            string[] bundledCandidates = new string[]
            {
                Path.Combine(appDir, "runtime", "node.exe"),
                Path.Combine(appDir, "runtime", PORTABLE_NODE_FOLDER, "node.exe"),
                Path.Combine(appDir, "node", "node.exe"),
                Path.Combine(appDir, "server", "bin", "node.exe"),
                Path.Combine(appDir, "node.exe"),
                Path.Combine(localAppData, "SonicWave", "runtime", PORTABLE_NODE_FOLDER, "node.exe"),
                Path.Combine(localAppData, "SonicWave", "runtime", "node.exe")
            };

            foreach (string p in bundledCandidates)
            {
                if (File.Exists(p)) return p;
            }

            string[] searchPaths = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "nodejs", "node.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "nodejs", "node.exe"),
                Path.Combine(localAppData, "Programs", "node", "node.exe")
            };

            foreach (string p in searchPaths)
            {
                if (File.Exists(p)) return p;
            }

            string pathEnv = Environment.GetEnvironmentVariable("PATH") ?? "";
            foreach (string dir in pathEnv.Split(';'))
            {
                if (string.IsNullOrEmpty(dir)) continue;
                try
                {
                    string candidate = Path.Combine(dir.Trim(), "node.exe");
                    if (File.Exists(candidate)) return candidate;
                }
                catch {}
            }

            return null;
        }

        private static string AutoProvisionPortableNode()
        {
            string localRuntimeDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "SonicWave",
                "runtime"
            );
            string targetNodeExe = Path.Combine(localRuntimeDir, PORTABLE_NODE_FOLDER, "node.exe");
            if (File.Exists(targetNodeExe)) return targetNodeExe;

            Directory.CreateDirectory(localRuntimeDir);
            string zipPath = Path.Combine(localRuntimeDir, "node-portable.zip");
            string resultNodePath = null;
            Exception capturedError = null;

            Form splash = new Form
            {
                Text = "SonicWave Runtime Setup",
                Width = 440,
                Height = 140,
                StartPosition = FormStartPosition.CenterScreen,
                FormBorderStyle = FormBorderStyle.FixedDialog,
                MaximizeBox = false,
                MinimizeBox = false,
                ControlBox = false,
                BackColor = Color.FromArgb(18, 18, 18),
                ForeColor = Color.White
            };

            Label statusLabel = new Label
            {
                Text = "First launch: bootstrapping private SonicWave runtime...",
                AutoSize = false,
                Width = 390,
                Height = 28,
                Location = new Point(22, 24),
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                ForeColor = Color.White
            };

            ProgressBar bar = new ProgressBar
            {
                Location = new Point(22, 60),
                Width = 390,
                Height = 14,
                Style = ProgressBarStyle.Marquee
            };

            splash.Controls.Add(statusLabel);
            splash.Controls.Add(bar);

            Thread worker = new Thread(() =>
            {
                try
                {
                    ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072 | (SecurityProtocolType)192 | (SecurityProtocolType)768;
                    using (WebClient wc = new WebClient())
                    {
                        wc.Headers.Add("User-Agent", "SonicWaveDesktop/1.0");
                        wc.DownloadProgressChanged += (s, ev) =>
                        {
                            try
                            {
                                splash.BeginInvoke((MethodInvoker)(() =>
                                {
                                    bar.Style = ProgressBarStyle.Continuous;
                                    bar.Value = Math.Min(90, Math.Max(5, (int)(ev.ProgressPercentage * 0.9)));
                                    statusLabel.Text = string.Format("Bootstrapping SonicWave runtime... {0}%", ev.ProgressPercentage);
                                }));
                            }
                            catch {}
                        };

                        wc.DownloadFile(PORTABLE_NODE_URL, zipPath);
                    }

                    splash.BeginInvoke((MethodInvoker)(() =>
                    {
                        statusLabel.Text = "Extracting runtime files...";
                        bar.Value = 95;
                    }));

                    string extractRoot = Path.Combine(localRuntimeDir, PORTABLE_NODE_FOLDER);
                    if (Directory.Exists(extractRoot))
                    {
                        Directory.Delete(extractRoot, true);
                    }
                    ZipFile.ExtractToDirectory(zipPath, localRuntimeDir);

                    if (File.Exists(targetNodeExe))
                    {
                        resultNodePath = targetNodeExe;
                    }
                }
                catch (Exception ex)
                {
                    capturedError = ex;
                }
                finally
                {
                    try { if (File.Exists(zipPath)) File.Delete(zipPath); } catch {}
                    try
                    {
                        splash.BeginInvoke((MethodInvoker)(() => splash.Close()));
                    }
                    catch {}
                }
            });

            worker.IsBackground = true;
            splash.Shown += (s, e) => worker.Start();
            Application.Run(splash);

            if (capturedError != null || string.IsNullOrEmpty(resultNodePath))
            {
                string msg = capturedError != null
                    ? capturedError.Message
                    : "Portable Node.js runtime could not be provisioned.";
                MessageBox.Show(
                    "SonicWave could not automatically download the portable runtime:\n\n" + msg +
                    "\n\nPlease verify internet connectivity and relaunch SonicWave.",
                    "SonicWave Runtime Notice",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning
                );
                return null;
            }

            return resultNodePath;
        }

        private static string FindEdgeExecutable()
        {
            string[] candidates = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe")
            };
            foreach (string p in candidates)
            {
                if (File.Exists(p)) return p;
            }
            return null;
        }

        private static string FindChromeExecutable()
        {
            string[] candidates = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe")
            };
            foreach (string p in candidates)
            {
                if (File.Exists(p)) return p;
            }
            return null;
        }

        private static void EnsureDependencies(string nodePath, string serverDir)
        {
            string nodeModules = Path.Combine(serverDir, "node_modules");
            if (!Directory.Exists(nodeModules))
            {
                string nodeDir = Path.GetDirectoryName(nodePath);
                string npmCmd = Path.Combine(nodeDir, "npm.cmd");
                string npmCli = Path.Combine(nodeDir, "node_modules", "npm", "bin", "npm-cli.js");

                ProcessStartInfo psi = null;
                if (File.Exists(npmCmd))
                {
                    psi = new ProcessStartInfo
                    {
                        FileName = npmCmd,
                        Arguments = "install --production",
                        WorkingDirectory = serverDir,
                        CreateNoWindow = true,
                        UseShellExecute = false,
                        WindowStyle = ProcessWindowStyle.Hidden
                    };
                }
                else if (File.Exists(npmCli))
                {
                    psi = new ProcessStartInfo
                    {
                        FileName = nodePath,
                        Arguments = "\"" + npmCli + "\" install --production",
                        WorkingDirectory = serverDir,
                        CreateNoWindow = true,
                        UseShellExecute = false,
                        WindowStyle = ProcessWindowStyle.Hidden
                    };
                }

                if (psi != null)
                {
                    PrependPath(psi, nodeDir);
                    try
                    {
                        Process p = Process.Start(psi);
                        if (p != null) p.WaitForExit(120000);
                    }
                    catch {}
                }
            }
        }

        private static void ShutdownBackend()
        {
            if (backendProcess != null)
            {
                try
                {
                    if (!backendProcess.HasExited)
                    {
                        backendProcess.Kill();
                    }
                }
                catch {}
                finally
                {
                    backendProcess = null;
                }
            }
        }
    }
}
