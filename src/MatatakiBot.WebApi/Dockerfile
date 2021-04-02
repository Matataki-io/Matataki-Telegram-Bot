FROM mcr.microsoft.com/dotnet/sdk:5.0-alpine AS build
WORKDIR /sln
COPY Directory.Build.props ./
COPY src/MatatakiBot.WebApi/MatatakiBot.WebApi.csproj src/MatatakiBot.WebApi/packages.lock.json src/MatatakiBot.WebApi/
COPY src/MatatakiBot/MatatakiBot.csproj src/MatatakiBot/packages.lock.json src/MatatakiBot/
COPY src/MatatakiBot.Core/MatatakiBot.Core.csproj src/MatatakiBot.Core/packages.lock.json src/MatatakiBot.Core/
RUN dotnet restore -r linux-musl-x64 src/MatatakiBot.WebApi/MatatakiBot.WebApi.csproj

COPY src/MatatakiBot.WebApi/ src/MatatakiBot.WebApi/
COPY src/MatatakiBot/ src/MatatakiBot/
COPY src/MatatakiBot.Core/ src/MatatakiBot.Core/
RUN dotnet publish -c Release -r linux-musl-x64 --self-contained true --no-restore src/MatatakiBot.WebApi/MatatakiBot.WebApi.csproj

FROM mcr.microsoft.com/dotnet/runtime-deps:5.0-alpine
RUN addgroup -g 1500 -S appuser && adduser -S -D -u 1500 -h /app -s /sbin/nologin -G appuser appuser

WORKDIR /app
COPY --from=build --chown=1500:1500 /sln/artifacts/MatatakiBot.WebApi/Release/net5.0/linux-musl-x64/publish ./

USER appuser
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["./MatatakiBot.WebApi"]

