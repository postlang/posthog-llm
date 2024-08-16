# Build Custom Clickhouse Docker Image

This is a custom ClickHouse image is designed for use with CapRover. Please refer to caprover-deploy.yml for the deployment example.

This image includes all necessary files to run ClickHouse with PostHog-LLM.

When deploying to CapRover, each service has a dynamic name. We retrieve the ZooKeeper service name, and update the clickhouse `config.xml` pointing current Zookeper host.

Commands used to build the clickhouse image (project root):
```bash
docker build -f Dockerfile.clickhouse -t clickhouse-custom . 
docker tag clickhouse-custom user/clickhouse
docker push user/clickhouse
```