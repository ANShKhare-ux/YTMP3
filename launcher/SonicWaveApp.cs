using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;

namespace SonicWaveApp
{
    static class Program
    {
        private static Process backendProcess = null;

        [STAThread]
        static void Main(string[] args)
        {
            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            string serverDir = Path.Combine(appDir, "server");
            string serverIndex = Path.Combine(serverDir, "index.js");

            // If not found directly, check parent directories (e.g. running from a bin subfolder)
            if (!File.Exists(serverIndex))
            {
                string parentServer = Path.Combine(Directory.GetParent(appDir).FullName, "server", "index.js");
                if (File.Exists(parentServer))
                {
                    serverDir = Path.Combine(Directory.GetParent(appDir).FullName, "server");
                    serverIndex = parentServer;
                }
            }

            // 1. Locate Node.js executable
            string nodePath = FindNodeExecutable();
            if (string.IsNullOrEmpty(nodePath))
            {
                DialogResult res = MessageBox.Show(
                    "SonicWave requires Node.js to power the local media conversion engine.\n\nWould you like to open the official Node.js download page?",
                    "SonicWave Engine Notice",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Information
                );
                if (res == DialogResult.Yes)
                {
                    Process.Start(new ProcessStartInfo("https://nodejs.org/en/download") { UseShellExecute = true });
                }
                return;
            }

            // 2. Check if backend is already responding on port 3001
            bool serverReady = IsServerResponding("http://localhost:3001/api/status");
            if (!serverReady && File.Exists(serverIndex))
            {
                EnsureDependencies(nodePath, serverDir);

                try
                {
                    ProcessStartInfo psi = new ProcessStartInfo
                    {
                        FileName = nodePath,
                        Arguments = "\"" + serverIndex + "\"",
                        WorkingDirectory = serverDir,
                        CreateNoWindow = true,
                        UseShellExecute = false,
                        WindowStyle = ProcessWindowStyle.Hidden
                    };
                    psi.EnvironmentVariables["PORT"] = "3001";
                    psi.EnvironmentVariables["NODE_ENV"] = "production";

                    backendProcess = Process.Start(psi);
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Failed to start SonicWave backend engine: " + ex.Message, "SonicWave Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                // Poll for server readiness up to 15 seconds
                int waited = 0;
                while (waited < 15000)
                {
                    Thread.Sleep(300);
                    waited += 300;
                    if (IsServerResponding("http://localhost:3001/api/status"))
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
            string appUrl = "http://localhost:3001/#app";
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

        private static bool IsServerResponding(string url)
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url);
                req.Timeout = 1000;
                req.Method = "GET";
                using (HttpWebResponse res = (HttpWebResponse)req.GetResponse())
                {
                    return res.StatusCode == HttpStatusCode.OK;
                }
            }
            catch
            {
                return false;
            }
        }

        private static string FindNodeExecutable()
        {
            string[] searchPaths = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "nodejs", "node.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "nodejs", "node.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "node", "node.exe")
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
                string npmCmd = Path.Combine(Path.GetDirectoryName(nodePath), "npm.cmd");
                if (File.Exists(npmCmd))
                {
                    try
                    {
                        ProcessStartInfo psi = new ProcessStartInfo
                        {
                            FileName = npmCmd,
                            Arguments = "install --production",
                            WorkingDirectory = serverDir,
                            CreateNoWindow = true,
                            UseShellExecute = false,
                            WindowStyle = ProcessWindowStyle.Hidden
                        };
                        Process p = Process.Start(psi);
                        if (p != null) p.WaitForExit(60000);
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
