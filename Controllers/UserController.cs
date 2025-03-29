using Microsoft.AspNetCore.Mvc;
using School_Driving.Controllers;
using System.Data.SQLite;

[ApiController]
[Route("[controller]/[action]")]
public class UserController : Controller
{

    [HttpPost]
    public IActionResult Create([FromForm] string email, [FromForm] string password)
    {
        string salt = PasswordManager.GenerateSalt();
        string hashedPassword = PasswordManager.GeneratePasswordHash(password, salt);

        SQLiteConnection connection = DatabaseConnector.Db();
        string insertSql = "INSERT INTO User (Email, PasswordHash, PasswordSalt) VALUES (@Email, @PasswordHash, @PasswordSalt)";
        using (SQLiteCommand cmd = new SQLiteCommand(insertSql, connection))
        {
            cmd.Parameters.AddWithValue("@Email", email);
            cmd.Parameters.AddWithValue("@PasswordHash", hashedPassword);
            cmd.Parameters.AddWithValue("@PasswordSalt", salt);
            cmd.ExecuteNonQuery();
        }
        return Ok("User created successfully");
    }

    [HttpPost]
    public IActionResult Login([FromForm] string email, [FromForm] string password)
    {
        SQLiteConnection connection = DatabaseConnector.Db();
        string selectSql = "SELECT UserID, PasswordHash, PasswordSalt FROM User WHERE Email = @Email";
        using (SQLiteCommand cmd = new SQLiteCommand(selectSql, connection))
        {
            cmd.Parameters.AddWithValue("@Email", email);
            using (SQLiteDataReader reader = cmd.ExecuteReader())
            {
                if (reader.Read())
                {
                    string? storedPasswordHash = reader["PasswordHash"].ToString();
                    string? storedSalt = reader["PasswordSalt"].ToString();

                    if (!string.IsNullOrEmpty(storedPasswordHash) && !string.IsNullOrEmpty(storedSalt) &&
                        PasswordManager.Verify(password, storedSalt, storedPasswordHash))
                    {
                        Int64 userID = Convert.ToInt64(reader["UserID"]);
                        string sessionCookie = SessionManager.CreateSession(userID);
                        Response.Cookies.Append("id", sessionCookie);
                        return Ok("Login successful. Session Cookie: " + sessionCookie);
                    }
                }
            }
        }
        return Unauthorized("Invalid email or password");
    }

    [HttpPost]
    public IActionResult Logout()
    {
        var sessionId = Request.Cookies["id"];
        if (string.IsNullOrEmpty(sessionId))
        {
            return new UnauthorizedResult();
        }
        SessionManager.InvalidateSession(sessionId);
        return Ok("Logout successful");

    }

    static public bool IsLoggedIn(string SessionCookie)
    {
        Int64 userID = SessionManager.GetUserID(SessionCookie);
        return userID != -1;
    }

    [HttpGet]
    public IActionResult GetUser()
    {
        var sessionId = Request.Cookies["id"];
        if (string.IsNullOrEmpty(sessionId))
        {
            return new UnauthorizedResult();
        }
        Int64 userID = SessionManager.GetUserID(sessionId);
        if (userID == -1)
        {
            return new UnauthorizedResult();
        }
        return Json(userID);
    }

    [HttpGet]
    public IActionResult CheckSession()
    {
        var sessionId = Request.Cookies["id"];
        if (string.IsNullOrEmpty(sessionId))
        {
            return Json(new { userID = -1 });
        }
        Int64 userID = SessionManager.GetUserID(sessionId);
        return Json(new { userID });
    }

    [HttpGet]
    public IActionResult GetUserList()
    {
        var users = new List<UserDto>();
        try
        {
            using (var connection = DatabaseConnector.CreateNewConnection())
            {
                string selectSql = "SELECT UserID, Username FROM User";
                using (var cmd = new SQLiteCommand(selectSql, connection))
                {
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            users.Add(new UserDto
                            {
                                UserID = reader.GetInt64(reader.GetOrdinal("UserID")),
                                Username = reader.GetString(reader.GetOrdinal("Username"))
                            });
                        }
                    }
                }
            }
            return Ok(users);
        }
        catch (Exception ex)
        {
            // Log the exception details
            Console.Error.WriteLine($"An error occurred: {ex.Message}");
            return StatusCode(500, "Internal server error");
        }
    }
}