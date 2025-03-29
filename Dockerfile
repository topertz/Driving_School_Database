# Use official .NET Core SDK image
FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /app

# Since the csproj and Dockerfile are both in the root of the repo, no need to refer to subdirectories
COPY ["Driving_School.csproj", "./"]
RUN dotnet restore "Driving_School.csproj"

# Copy the rest of the files to the Docker container
COPY . . 
RUN dotnet build "Driving_School.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Driving_School.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish . 
ENTRYPOINT ["dotnet", "Driving_School.dll"]
