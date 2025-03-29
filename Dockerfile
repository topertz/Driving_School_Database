# Use official .NET Core runtime image
FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS base
WORKDIR /app
EXPOSE 80

# Use the official .NET SDK image to build the application
FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /app

# Copy the project file and restore dependencies
COPY ["Driving_School.csproj", "./"]
RUN dotnet restore "Driving_School.csproj"

# Copy the rest of the source code to the container
COPY . .

# Ensure the SQLite database file is copied into the container
COPY database/UserDB.sqlite3 /app/database/UserDB.sqlite3

# Build the project
RUN dotnet build "Driving_School.csproj" -c Release -o /app/build

# Publish the project
FROM build AS publish
RUN dotnet publish "Driving_School.csproj" -c Release -o /app/publish

# Set the base image for the final stage
FROM base AS final
WORKDIR /app

# Copy the published app from the build stage
COPY --from=publish /app/publish .

# Ensure that the SQLite database is still available in the final image
COPY --from=build /app/database /app/database

# Set the entry point for the container to start the app
ENTRYPOINT ["dotnet", "Driving_School.dll"]
