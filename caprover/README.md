# PostHog-LLM Installation with CapRover

This guide will walk you through installing PostHog-LLM using CapRover within minutes! 

CapRover is an open-source platform-as-a-service (PaaS) that simplifies the deployment, scaling, and management of applications. It provides a straightforward web interface to deploy applications with a few clicks, making it an ideal tool for developers looking to manage their server with ease.

A machine with at least 8GB of RAM is recommended but 6GB should be enough aswell.

## Setting Up CapRover

You can easily install it **locally** by following the Caprover local's instructions [here](https://caprover.com/docs/get-started.html) or you can copy these commands:

```bash
sudo mkdir -p /captain/data

sudo echo "{\"skipVerifyingDomains\":\"true\"}" | sudo tee /captain/data/config-override.json > /dev/null

docker run -e ACCEPTED_TERMS=true -e MAIN_NODE_IP_ADDRESS=127.0.0.1 -p 80:80 -p 443:443 -p 3000:3000 -v /var/run/docker.sock:/var/run/docker.sock -v /captain:/captain caprover/caprover
```

Wait 60 seconds and navigate to `http://localhost:3000` and change your root domain to `captain.localhost`. CapRover now is ready to deploy PostHog-LLM. 🚀 


## Deploy PostHog-LLM

To deploy PostHog-LLM, we'll use a CapRover template file (`caprover-deploy.yml`) that simplifies the process. The template file will be used to deploy several apps required by PostHog-LLM.

Follow the steps below:

* Go to `Apps` -> `One Click Apps`, navigate to the bottom of the page and click `>> TEMPLATE <<`.

* Copy `caprover-deploy.yml` contents and paste it inside the textbox to set up the necessary apps, configurations, and environment variables (similar to a docker compose file). 


Fill out the form: you'll need to define an app name. Define the name of your app (e.g 'hobby') and Hit deploy. CapRover, will start deploying all apps.

*Note: For faster deployment, nothing is built. All images are pulled from DockerHub. The images for `web`, `worker`, and `plugin` are from the `Dockerfile.caprover` file.*  🚀 

After deployment, hit `finnish` and headover to the web service (Django) and navigate to `Deployment` page.

You'll see migration's running for Postgres and Clickhouse database. While these migrations are running you're not able to connect PostHog. Wait a few minutes and you'll see in the logs `posthog started`. After all migrations are setup, `worker` and `plugin` apps will also launch.

Navigate to the `web` service http link and PostHog Preflight page will show up. If you see 502 http error, most likely, PostHog is still initializing. You can find a video on how to self-host PostHog-LLM [here](https://www.youtube.com/watch?v=acPLzzzcui8).

Once you setup PostHog you can now upload some user-llms interactions. Check out our [repository](https://github.com/postlang/posthog-llm-examples) with examples on how to upload data to PostHog-LLM.

![web-preview](https://github.com/user-attachments/assets/da7fa7c7-7637-46e6-ae6c-40e774c38799)


# CD (Development)

The file below file provides a straightforward example of a continuous deployment workflow.

```docker
name: Deploy Posthog LLM to Caprover

on:
    push:
        branches: ['llm-main']

jobs:
    build_and_deploy:
        runs-on: ubuntu-latest

        steps:
            - name: Check out repository
              uses: actions/checkout@v4

            - name: Set up Docker Buildx
              uses: docker/setup-buildx-action@v3

            - name: Login to Docker Hub
              uses: docker/login-action@v3
              with:
                  registry: docker.io
                  username: ${{ secrets.DOCKER_USERNAME }}
                  password: ${{ secrets.DOCKER_PASSWORD }}

            - name: Set IMAGE URL
              id: set-vars
              run: |
                  echo "IMAGE_URL=andremoura/posthog-llm:${{ github.sha }}" >> $GITHUB_ENV
                  echo "LATEST_TAG=andremoura/posthog-llm:latest" >> $GITHUB_ENV

            - name: Build and push Docker Image
              uses: docker/build-push-action@v5
              with:
                  context: .
                  file: ./Dockerfile
                  push: true
                  tags: |
                      ${{ env.IMAGE_URL }}
                      ${{ env.LATEST_TAG }}

            - name: Deploy Web to CapRrover
              uses: caprover/deploy-from-github@v1.1.2
              with:
                  server: '${{ secrets.CAPROVER_SERVER }}'
                  app: '${{ secrets.WEB_APP }}'
                  token: '${{ secrets.WEB_TOKEN }}'
                  image: ${{ env.IMAGE_URL }}

            - name: Deploy Plugin to CapRrover
              uses: caprover/deploy-from-github@v1.1.2
              with:
                  server: '${{ secrets.CAPROVER_SERVER }}'
                  app: '${{ secrets.PLUGIN_APP }}'
                  token: '${{ secrets.PLUGIN_TOKEN }}'
                  image: ${{ env.IMAGE_URL }}

            - name: Deploy Worker to CapRrover
              uses: caprover/deploy-from-github@v1.1.2
              with:
                  server: '${{ secrets.CAPROVER_SERVER }}'
                  app: '${{ secrets.WORKER_APP }}'
                  token: '${{ secrets.WORKER_TOKEN }}'
                  image: ${{ env.IMAGE_URL }}
```

It automatically three apps:
* Web
* Plugin Server
* Worker

The workflow builds PostHog-LLM Docker image and pushes it to the DockerHub. Each service is then deployed to its respective CapRover app.

To use this workflow, the user must:

* Specify the CapRover server URL in the format http://captain.your-domain.com.
* Store the app names and their corresponding tokens as secrets. Check Deployment tab in your CapRover apps for the web, plugin and worker apps.
* Provide Docker credentials for logging into the container registry (username and token).

##  Services
* Kafka: A distributed event streaming platform used to handle real-time data. A key component in PostHog event ingestion service. Events are written to the Kafka topics and then pulled by other apps (Clickhouse, Plugin-server)

* Zookeeper: A centralized service for maintaining configuration information, naming and for coordinating Kafka and ClickHouse clusters

* ClickHouse - Used for storing big data, such as events and analytics queries.

* Postgres - stores data such as users, projects, insights, dashboards.

* Redis – for caching and inter-service communication

Then we have the four main PostHog components:

* Web server running Django amd API for users and Frontend - running under the web service
* Plugin server to handle event ingestion and apps/plugins (GeoIP for instance)
* Celery Worker: for background tasks