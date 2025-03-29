using System;
using System.IO;
using System.Data.SQLite;

namespace School_Driving.Controllers
{
    public static class DatabaseConnector
    {
        private static SQLiteConnection? conn;

        public static SQLiteConnection Db()
        {
            if (conn == null)
            {
                // A projekt gyökérkönyvtárának biztonságos meghatározása
                string? projectRoot = GetProjectRoot();

                if (projectRoot == null)
                {
                    throw new InvalidOperationException("Nem sikerült meghatározni a projekt gyökérkönyvtárát!");
                }

                string dbPath = Path.Combine(projectRoot, "database", "UserDB.sqlite3");

                if (!File.Exists(dbPath))
                {
                    Console.WriteLine("HIBA: Az adatbázis fájl nem található!");
                    throw new FileNotFoundException("Az adatbázis nem található a megadott helyen.", dbPath);
                }

                conn = new SQLiteConnection($"Data Source={dbPath}");
                conn.Open();
            }
            else if (conn.State == System.Data.ConnectionState.Closed)
            {
                conn.Open();
            }

            return conn;
        }

        public static SQLiteConnection CreateNewConnection()
        {
            string? projectRoot = GetProjectRoot();

            if (projectRoot == null)
            {
                throw new InvalidOperationException("Nem sikerült meghatározni a projekt gyökérkönyvtárát!");
            }

            string dbPath = Path.Combine(projectRoot, "database", "UserDB.sqlite3");

            var conn = new SQLiteConnection($"Data Source={dbPath}");
            conn.Open();
            return conn;
        }

        private static string? GetProjectRoot()
        {
            // In Docker, the working directory is /app
            string baseDirectory = AppDomain.CurrentDomain.BaseDirectory;
        
            // Check if we're in a Docker environment (path should be '/app' or similar)
            if (baseDirectory.Contains("/app"))
            {
                return "/app"; // Return the base directory inside the Docker container
            }
        
            // For non-Docker environments, go up three levels
            DirectoryInfo? dir = new DirectoryInfo(baseDirectory);
            for (int i = 0; i < 3; i++)
            {
                if (dir?.Parent == null) return null;
                dir = dir.Parent;
            }
        
            return dir?.FullName;
        }
    }
}
