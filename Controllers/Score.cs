public class Score
{
    public int ScoreID { get; set; }
    public string? Username { get; set; }
    public int ScoreValue { get; set; }
    public int TotalPoints { get; set; }
    public double Percentage { get; set; }
    public string? Category { get; set; }
    public DateTime Timestamp { get; set; }
    public int Duration { get; set; }
}
