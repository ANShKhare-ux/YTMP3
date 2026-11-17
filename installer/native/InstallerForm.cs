using System;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Media.Effects;
using System.Windows.Shapes;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Win32;
using System.Diagnostics;

namespace SonicWaveInstaller
{
    public class App : Application
    {
        [STAThread]
        public static void Main()
        {
            try
            {
                App app = new App();
                InstallerWindow win = new InstallerWindow();
                win.Show();
                app.Run(win);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Installer error: " + ex.Message, "SonicWave Setup", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }
    }

    public class InstallerWindow : Window
    {
        private TextBox pathBox;
        private CheckBox chkDesktop;
        private CheckBox chkStartMenu;
        private CheckBox chkAutoLaunch;
        private Button btnInstall;
        private Grid optionsScreen;
        private Grid progressScreen;
        private Grid finishScreen;
        private ProgressBar progressBar;
        private TextBlock statusText;
        private TextBlock percentText;
        private string finalExePath = "";

        public InstallerWindow()
        {
            Title = "SonicWave Setup";
            Width = 740;
            Height = 500;
            WindowStartupLocation = WindowStartupLocation.CenterScreen;
            WindowStyle = WindowStyle.None;
            AllowsTransparency = true;
            Background = Brushes.Transparent;
            ResizeMode = ResizeMode.NoResize;

            Border mainBorder = new Border
            {
                CornerRadius = new CornerRadius(12),
                Background = new SolidColorBrush(Color.FromRgb(18, 18, 18)),
                BorderBrush = new SolidColorBrush(Color.FromArgb(30, 255, 255, 255)),
                BorderThickness = new Thickness(1),
                Effect = new DropShadowEffect
                {
                    Color = Colors.Black,
                    Direction = 270,
                    ShadowDepth = 15,
                    BlurRadius = 35,
                    Opacity = 0.85
                }
            };

            Grid rootGrid = new Grid();
            rootGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(46) }); // Title Bar
            rootGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) }); // Content

            // Title Bar
            Border titleBar = new Border
            {
                Background = new SolidColorBrush(Color.FromArgb(240, 18, 18, 18)),
                BorderBrush = new SolidColorBrush(Color.FromArgb(15, 255, 255, 255)),
                BorderThickness = new Thickness(0, 0, 0, 1),
                Padding = new Thickness(16, 0, 16, 0)
            };
            titleBar.MouseLeftButtonDown += (s, e) => { if (e.ButtonState == System.Windows.Input.MouseButtonState.Pressed) DragMove(); };

            Grid titleGrid = new Grid();
            StackPanel leftTitle = new StackPanel { Orientation = Orientation.Horizontal, VerticalAlignment = VerticalAlignment.Center };

            // Mini wave
            StackPanel miniWave = new StackPanel { Orientation = Orientation.Horizontal, VerticalAlignment = VerticalAlignment.Center, Margin = new Thickness(0, 0, 10, 0) };
            int[] barHeights = new int[] { 8, 14, 18, 12, 6 };
            for (int i = 0; i < barHeights.Length; i++)
            {
                miniWave.Children.Add(new Rectangle
                {
                    Width = 3,
                    Height = barHeights[i],
                    RadiusX = 1.5,
                    RadiusY = 1.5,
                    Fill = (i == 2) ? new SolidColorBrush(Color.FromRgb(0, 245, 212)) : new SolidColorBrush(Color.FromRgb(30, 215, 96)),
                    Margin = new Thickness(1.5, 0, 1.5, 0),
                    VerticalAlignment = VerticalAlignment.Center
                });
            }
            leftTitle.Children.Add(miniWave);

            TextBlock titleLabel = new TextBlock
            {
                Text = "SonicWave Setup",
                Foreground = new SolidColorBrush(Color.FromRgb(226, 232, 240)),
                FontWeight = FontWeights.SemiBold,
                FontSize = 13,
                VerticalAlignment = VerticalAlignment.Center
            };
            leftTitle.Children.Add(titleLabel);

            Border badge = new Border
            {
                Background = new SolidColorBrush(Color.FromArgb(40, 30, 215, 96)),
                BorderBrush = new SolidColorBrush(Color.FromArgb(80, 30, 215, 96)),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(10),
                Padding = new Thickness(6, 1, 6, 1),
                Margin = new Thickness(8, 0, 0, 0),
                VerticalAlignment = VerticalAlignment.Center
            };
            badge.Child = new TextBlock
            {
                Text = "v1.0.0",
                Foreground = new SolidColorBrush(Color.FromRgb(30, 215, 96)),
                FontSize = 10,
                FontWeight = FontWeights.Bold
            };
            leftTitle.Children.Add(badge);
            titleGrid.Children.Add(leftTitle);

            // Window Controls (Minimize, Close)
            StackPanel controls = new StackPanel { Orientation = Orientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Right, VerticalAlignment = VerticalAlignment.Center };
            Button btnMin = CreateControlBtn("—", () => WindowState = WindowState.Minimized);
            Button btnClose = CreateControlBtn("✕", () => Close(), isClose: true);
            controls.Children.Add(btnMin);
            controls.Children.Add(btnClose);
            titleGrid.Children.Add(controls);
            titleBar.Child = titleGrid;
            Grid.SetRow(titleBar, 0);
            rootGrid.Children.Add(titleBar);

            // Content Area
            Grid contentArea = new Grid();
            BuildOptionsScreen(contentArea);
            BuildProgressScreen(contentArea);
            BuildFinishScreen(contentArea);

            Grid.SetRow(contentArea, 1);
            rootGrid.Children.Add(contentArea);

            mainBorder.Child = rootGrid;
            Content = mainBorder;
        }

        private Button CreateControlBtn(string symbol, Action onClick, bool isClose = false)
        {
            Button btn = new Button
            {
                Content = symbol,
                Width = 30,
                Height = 30,
                Margin = new Thickness(4, 0, 0, 0),
                Background = Brushes.Transparent,
                BorderThickness = new Thickness(0),
                Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184)),
                FontSize = isClose ? 11 : 12,
                Cursor = System.Windows.Input.Cursors.Hand
            };
            btn.Click += (s, e) => onClick();
            btn.MouseEnter += (s, e) =>
            {
                btn.Background = isClose ? new SolidColorBrush(Color.FromArgb(200, 239, 68, 68)) : new SolidColorBrush(Color.FromArgb(40, 255, 255, 255));
                btn.Foreground = Brushes.White;
            };
            btn.MouseLeave += (s, e) =>
            {
                btn.Background = Brushes.Transparent;
                btn.Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184));
            };
            return btn;
        }

        private void BuildOptionsScreen(Grid parent)
        {
            optionsScreen = new Grid { Margin = new Thickness(36, 24, 36, 28) };
            optionsScreen.RowDefinitions.Add(new RowDefinition { Height = new GridLength(85) }); // Hero branding
            optionsScreen.RowDefinitions.Add(new RowDefinition { Height = new GridLength(100) }); // Folder Picker
            optionsScreen.RowDefinitions.Add(new RowDefinition { Height = new GridLength(120) }); // Checkboxes
            optionsScreen.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) }); // Install Button

            // Hero branding
            StackPanel hero = new StackPanel { VerticalAlignment = VerticalAlignment.Center };
            TextBlock brand = new TextBlock
            {
                Text = "SonicWave",
                FontSize = 28,
                FontWeight = FontWeights.Bold,
                Foreground = new SolidColorBrush(Color.FromRgb(30, 215, 96))
            };
            TextBlock subhead = new TextBlock
            {
                Text = "High-Fidelity Media Converter & Studio • Native Windows Installation",
                FontSize = 13,
                Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184)),
                Margin = new Thickness(0, 4, 0, 0)
            };
            hero.Children.Add(brand);
            hero.Children.Add(subhead);
            Grid.SetRow(hero, 0);
            optionsScreen.Children.Add(hero);

            // Folder Picker Box
            StackPanel pathSection = new StackPanel { VerticalAlignment = VerticalAlignment.Center };
            TextBlock pathLabel = new TextBlock
            {
                Text = "INSTALLATION DIRECTORY",
                FontSize = 11,
                FontWeight = FontWeights.Bold,
                Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184)),
                Margin = new Thickness(0, 0, 0, 8)
            };
            pathSection.Children.Add(pathLabel);

            Grid pathRow = new Grid();
            pathRow.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            pathRow.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(100) });

            string defaultPath = System.IO.Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Programs", "SonicWave"
            );

            pathBox = new TextBox
            {
                Text = defaultPath,
                Background = new SolidColorBrush(Color.FromRgb(24, 24, 24)),
                Foreground = new SolidColorBrush(Color.FromRgb(241, 245, 249)),
                BorderBrush = new SolidColorBrush(Color.FromArgb(40, 255, 255, 255)),
                BorderThickness = new Thickness(1),
                Padding = new Thickness(10, 8, 10, 8),
                FontSize = 12.5,
                VerticalContentAlignment = VerticalAlignment.Center
            };
            Grid.SetColumn(pathBox, 0);
            pathRow.Children.Add(pathBox);

            Button btnBrowse = new Button
            {
                Content = "Browse...",
                Margin = new Thickness(10, 0, 0, 0),
                Background = new SolidColorBrush(Color.FromArgb(20, 255, 255, 255)),
                Foreground = new SolidColorBrush(Color.FromRgb(226, 232, 240)),
                BorderBrush = new SolidColorBrush(Color.FromArgb(40, 255, 255, 255)),
                BorderThickness = new Thickness(1),
                FontSize = 12,
                FontWeight = FontWeights.SemiBold,
                Cursor = System.Windows.Input.Cursors.Hand
            };
            btnBrowse.Click += (s, e) =>
            {
                var dialog = new System.Windows.Forms.FolderBrowserDialog();
                dialog.Description = "Select Installation Folder for SonicWave";
                dialog.SelectedPath = pathBox.Text;
                if (dialog.ShowDialog() == System.Windows.Forms.DialogResult.OK)
                {
                    pathBox.Text = System.IO.Path.Combine(dialog.SelectedPath, "SonicWave");
                }
            };
            Grid.SetColumn(btnBrowse, 1);
            pathRow.Children.Add(btnBrowse);
            pathSection.Children.Add(pathRow);

            Grid.SetRow(pathSection, 1);
            optionsScreen.Children.Add(pathSection);

            // Checkboxes
            StackPanel checkSection = new StackPanel { VerticalAlignment = VerticalAlignment.Center };
            chkDesktop = CreateStyledCheckbox("Create a Desktop shortcut", true);
            chkStartMenu = CreateStyledCheckbox("Create a Start Menu shortcut", true);
            chkAutoLaunch = CreateStyledCheckbox("Launch SonicWave after installation completes", true);
            checkSection.Children.Add(chkDesktop);
            checkSection.Children.Add(chkStartMenu);
            checkSection.Children.Add(chkAutoLaunch);

            Grid.SetRow(checkSection, 2);
            optionsScreen.Children.Add(checkSection);

            // Install Button
            Grid buttonRow = new Grid();
            btnInstall = new Button
            {
                Content = "Install SonicWave",
                Height = 44,
                Background = new SolidColorBrush(Color.FromRgb(30, 215, 96)),
                Foreground = new SolidColorBrush(Color.FromRgb(18, 18, 18)),
                FontSize = 14,
                FontWeight = FontWeights.Bold,
                BorderThickness = new Thickness(0),
                Cursor = System.Windows.Input.Cursors.Hand
            };
            btnInstall.MouseEnter += (s, e) => { btnInstall.Background = new SolidColorBrush(Color.FromRgb(35, 235, 105)); };
            btnInstall.MouseLeave += (s, e) => { btnInstall.Background = new SolidColorBrush(Color.FromRgb(30, 215, 96)); };
            btnInstall.Click += (s, e) => StartInstallation();

            buttonRow.Children.Add(btnInstall);
            Grid.SetRow(buttonRow, 3);
            optionsScreen.Children.Add(buttonRow);

            parent.Children.Add(optionsScreen);
        }

        private CheckBox CreateStyledCheckbox(string label, bool isChecked)
        {
            CheckBox cb = new CheckBox
            {
                Content = label,
                IsChecked = isChecked,
                Foreground = new SolidColorBrush(Color.FromRgb(203, 213, 225)),
                FontSize = 13,
                Margin = new Thickness(0, 4, 0, 6),
                Cursor = System.Windows.Input.Cursors.Hand
            };
            return cb;
        }

        private void BuildProgressScreen(Grid parent)
        {
            progressScreen = new Grid { Visibility = Visibility.Collapsed, Margin = new Thickness(48, 60, 48, 60) };
            StackPanel center = new StackPanel { VerticalAlignment = VerticalAlignment.Center, HorizontalAlignment = HorizontalAlignment.Center, Width = 560 };

            TextBlock pTitle = new TextBlock
            {
                Text = "Installing SonicWave...",
                FontSize = 22,
                FontWeight = FontWeights.Bold,
                Foreground = new SolidColorBrush(Color.FromRgb(248, 250, 252)),
                TextAlignment = TextAlignment.Center,
                Margin = new Thickness(0, 0, 0, 8)
            };
            center.Children.Add(pTitle);

            statusText = new TextBlock
            {
                Text = "Preparing installation environment...",
                FontSize = 13,
                Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184)),
                TextAlignment = TextAlignment.Center,
                Margin = new Thickness(0, 0, 0, 24)
            };
            center.Children.Add(statusText);

            // Progress Bar
            progressBar = new ProgressBar
            {
                Height = 10,
                Minimum = 0,
                Maximum = 100,
                Value = 0,
                Background = new SolidColorBrush(Color.FromArgb(40, 255, 255, 255)),
                Foreground = new SolidColorBrush(Color.FromRgb(30, 215, 96)),
                BorderThickness = new Thickness(0)
            };
            center.Children.Add(progressBar);

            percentText = new TextBlock
            {
                Text = "0%",
                FontSize = 12,
                FontWeight = FontWeights.SemiBold,
                Foreground = new SolidColorBrush(Color.FromRgb(30, 215, 96)),
                TextAlignment = TextAlignment.Center,
                Margin = new Thickness(0, 10, 0, 0)
            };
            center.Children.Add(percentText);

            progressScreen.Children.Add(center);
            parent.Children.Add(progressScreen);
        }

        private void BuildFinishScreen(Grid parent)
        {
            finishScreen = new Grid { Visibility = Visibility.Collapsed, Margin = new Thickness(48, 60, 48, 60) };
            StackPanel center = new StackPanel { VerticalAlignment = VerticalAlignment.Center, HorizontalAlignment = HorizontalAlignment.Center, Width = 560 };

            Border checkCircle = new Border
            {
                Width = 56,
                Height = 56,
                CornerRadius = new CornerRadius(28),
                Background = new SolidColorBrush(Color.FromArgb(40, 30, 215, 96)),
                BorderBrush = new SolidColorBrush(Color.FromRgb(30, 215, 96)),
                BorderThickness = new Thickness(2),
                HorizontalAlignment = HorizontalAlignment.Center,
                Margin = new Thickness(0, 0, 0, 16)
            };
            checkCircle.Child = new TextBlock
            {
                Text = "✓",
                FontSize = 26,
                FontWeight = FontWeights.Bold,
                Foreground = new SolidColorBrush(Color.FromRgb(30, 215, 96)),
                HorizontalAlignment = HorizontalAlignment.Center,
                VerticalAlignment = VerticalAlignment.Center
            };
            center.Children.Add(checkCircle);

            TextBlock fTitle = new TextBlock
            {
                Text = "Installation Complete!",
                FontSize = 24,
                FontWeight = FontWeights.Bold,
                Foreground = new SolidColorBrush(Color.FromRgb(248, 250, 252)),
                TextAlignment = TextAlignment.Center,
                Margin = new Thickness(0, 0, 0, 8)
            };
            center.Children.Add(fTitle);

            TextBlock fSub = new TextBlock
            {
                Text = "SonicWave has been successfully installed on your computer.\nYou can now extract and convert high-fidelity media anytime.",
                FontSize = 13,
                Foreground = new SolidColorBrush(Color.FromRgb(148, 163, 184)),
                TextAlignment = TextAlignment.Center,
                LineHeight = 20,
                Margin = new Thickness(0, 0, 0, 24)
            };
            center.Children.Add(fSub);

            Button btnLaunch = new Button
            {
                Content = "Launch SonicWave Now ⚡",
                Height = 44,
                Width = 260,
                Background = new SolidColorBrush(Color.FromRgb(30, 215, 96)),
                Foreground = new SolidColorBrush(Color.FromRgb(18, 18, 18)),
                FontSize = 14,
                FontWeight = FontWeights.Bold,
                BorderThickness = new Thickness(0),
                Cursor = System.Windows.Input.Cursors.Hand
            };
            btnLaunch.MouseEnter += (s, e) => { btnLaunch.Background = new SolidColorBrush(Color.FromRgb(35, 235, 105)); };
            btnLaunch.MouseLeave += (s, e) => { btnLaunch.Background = new SolidColorBrush(Color.FromRgb(30, 215, 96)); };
            btnLaunch.Click += (s, e) =>
            {
                LaunchInstalledApp();
                Close();
            };
            center.Children.Add(btnLaunch);

            finishScreen.Children.Add(center);
            parent.Children.Add(finishScreen);
        }

        private async void StartInstallation()
        {
            string targetDir = pathBox.Text.Trim();
            if (string.IsNullOrEmpty(targetDir)) return;

            bool createDesktop = chkDesktop.IsChecked == true;
            bool createStartMenu = chkStartMenu.IsChecked == true;
            bool autoLaunch = chkAutoLaunch.IsChecked == true;

            optionsScreen.Visibility = Visibility.Collapsed;
            progressScreen.Visibility = Visibility.Visible;

            await Task.Run(() =>
            {
                try
                {
                    UpdateProgress(10, "Initializing destination folder...");
                    if (!Directory.Exists(targetDir))
                    {
                        Directory.CreateDirectory(targetDir);
                    }

                    UpdateProgress(25, "Extracting SonicWave engine & files...");
                    ExtractEmbeddedPackage(targetDir);

                    UpdateProgress(70, "Configuring Windows shortcuts & icons...");
                    string exePath = System.IO.Path.Combine(targetDir, "SonicWave.exe");
                    string batPath = System.IO.Path.Combine(targetDir, "start.bat");
                    finalExePath = File.Exists(exePath) ? exePath : batPath;

                    string iconPath = System.IO.Path.Combine(targetDir, "client", "public", "favicon.ico");
                    if (!File.Exists(iconPath)) iconPath = finalExePath;

                    if (createDesktop)
                    {
                        UpdateProgress(80, "Creating Desktop shortcut...");
                        string desktopPath = System.IO.Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "SonicWave.lnk");
                        CreateShortcut(desktopPath, finalExePath, iconPath, "SonicWave - High-Fidelity Media Converter & Studio");
                    }

                    if (createStartMenu)
                    {
                        UpdateProgress(88, "Registering Start Menu shortcut...");
                        string startMenuDir = System.IO.Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "SonicWave");
                        if (!Directory.Exists(startMenuDir)) Directory.CreateDirectory(startMenuDir);
                        string startMenuLnk = System.IO.Path.Combine(startMenuDir, "SonicWave.lnk");
                        CreateShortcut(startMenuLnk, finalExePath, iconPath, "SonicWave - High-Fidelity Media Converter & Studio");
                    }

                    UpdateProgress(95, "Registering Windows uninstaller...");
                    RegisterUninstaller(targetDir, finalExePath, iconPath);

                    UpdateProgress(100, "Installation complete!");
                    Thread.Sleep(500);

                    Dispatcher.Invoke(() =>
                    {
                        progressScreen.Visibility = Visibility.Collapsed;
                        finishScreen.Visibility = Visibility.Visible;
                        if (autoLaunch)
                        {
                            Task.Delay(1000).ContinueWith(_ =>
                            {
                                Dispatcher.Invoke(() =>
                                {
                                    LaunchInstalledApp();
                                    Close();
                                });
                            });
                        }
                    });
                }
                catch (Exception ex)
                {
                    Dispatcher.Invoke(() =>
                    {
                        MessageBox.Show("Installation Error: " + ex.Message, "SonicWave Setup", MessageBoxButton.OK, MessageBoxImage.Error);
                        Close();
                    });
                }
            });
        }

        private void UpdateProgress(int percent, string message)
        {
            Dispatcher.Invoke(() =>
            {
                progressBar.Value = percent;
                percentText.Text = percent + "%";
                statusText.Text = message;
            });
        }

        private void ExtractEmbeddedPackage(string destinationDir)
        {
            Assembly asm = Assembly.GetExecutingAssembly();
            using (Stream stream = asm.GetManifestResourceStream("SonicWavePackage.zip"))
            {
                if (stream == null)
                {
                    // Fallback to local files if zip resource is absent in dev mode
                    string localZip = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "SonicWave-v1.0.0-Windows.zip");
                    if (File.Exists(localZip))
                    {
                        using (FileStream fs = File.OpenRead(localZip))
                        using (ZipArchive archive = new ZipArchive(fs, ZipArchiveMode.Read))
                        {
                            archive.ExtractToDirectory(destinationDir);
                        }
                        return;
                    }
                    throw new InvalidOperationException("Embedded package archive (SonicWavePackage.zip) was not found.");
                }

                using (ZipArchive archive = new ZipArchive(stream, ZipArchiveMode.Read))
                {
                    foreach (ZipArchiveEntry entry in archive.Entries)
                    {
                        string fullPath = System.IO.Path.Combine(destinationDir, entry.FullName);
                        string dir = System.IO.Path.GetDirectoryName(fullPath);
                        if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                        {
                            Directory.CreateDirectory(dir);
                        }

                        if (string.IsNullOrEmpty(entry.Name)) continue; // directory entry

                        entry.ExtractToFile(fullPath, overwrite: true);
                    }
                }
            }
        }

        private void CreateShortcut(string shortcutPath, string targetPath, string iconPath, string description)
        {
            try
            {
                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                dynamic shell = Activator.CreateInstance(shellType);
                dynamic shortcut = shell.CreateShortcut(shortcutPath);
                shortcut.TargetPath = targetPath;
                shortcut.WorkingDirectory = System.IO.Path.GetDirectoryName(targetPath);
                shortcut.Description = description;
                if (!string.IsNullOrEmpty(iconPath) && File.Exists(iconPath))
                {
                    shortcut.IconLocation = iconPath + ",0";
                }
                shortcut.Save();
            }
            catch {}
        }

        private void RegisterUninstaller(string installDir, string exePath, string iconPath)
        {
            try
            {
                string keyPath = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\SonicWave";
                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(keyPath))
                {
                    if (key != null)
                    {
                        key.SetValue("DisplayName", "SonicWave - Media Converter & Studio");
                        key.SetValue("DisplayVersion", "1.0.0");
                        key.SetValue("Publisher", "SonicWave Contributors");
                        key.SetValue("InstallLocation", installDir);
                        key.SetValue("DisplayIcon", iconPath);
                        key.SetValue("UninstallString", "cmd.exe /c rmdir /s /q \"" + installDir + "\"");
                        key.SetValue("NoModify", 1, RegistryValueKind.DWord);
                        key.SetValue("NoRepair", 1, RegistryValueKind.DWord);
                    }
                }
            }
            catch {}
        }

        private void LaunchInstalledApp()
        {
            try
            {
                if (File.Exists(finalExePath))
                {
                    ProcessStartInfo psi = new ProcessStartInfo
                    {
                        FileName = finalExePath,
                        WorkingDirectory = System.IO.Path.GetDirectoryName(finalExePath),
                        UseShellExecute = true
                    };
                    Process.Start(psi);
                }
            }
            catch {}
        }
    }
}
