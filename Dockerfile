# Használj hivatalos .NET Core SDK image-t
FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /app

# Mivel a csproj és a Dockerfile is a repo gyökerében található, nem szükséges almappára hivatkozni
COPY ["Driving_School.csproj", "./"]
RUN dotnet restore "Driving_School.csproj"

# Az összes többi fájlt másoljuk a Docker konténerbe
COPY . . 
RUN dotnet build "Driving_School.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Driving_School.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish . 
ENTRYPOINT ["dotnet", "Driving_School.dll"]
