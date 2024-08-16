# PostHog-LLM Installation with CapRover

This guide will walk you through installing PostHog-LLM using CapRover. 

CapRover is an open-source platform-as-a-service (PaaS) that simplifies the deployment, scaling, and management of applications. It provides a straightforward web interface to deploy applications with a few clicks, making it an ideal tool for developers looking to manage their server with ease.

A machine with at least 8GB of RAM is recommended but 6GB should be enough aswell.

## Setting Up CapRover

Before deploying PostHog with CapRover, ensure that you have already set up a CapRover server. If you haven't done this yet, follow the setup instructions on the official CapRover [documentation](https://caprover.com/docs/get-started.html).

## Deploy PostHog-LLM

Once you have CapRover up and running, you're ready to deploy PostHog-LLM.

To deploy PostHog-LLM, we'll use a CapRover template file (`caprover-deploy.yml`) that simplifies the process. The template file will be used to deploy several services required by PostHog-LLM.

Follow the steps below:

* Login to CapRover Dashboard: Access your CapRover dashboard via your server's URL (e.g localhost:3000 or your root domain)

* Go to `Apps` -> `One Click Apps`, navigate to the bottom of the page and click `>> TEMPLATE <<`.

* Copy `caprover-deploy.yml` contents and paste it inside the textbox to set up the necessary services, configurations, and environment variables (similar to a docker compose file). 


Fill out the form: you'll need to define an app name. Define the name of your app (e.g 'hobby') and Hit deploy. CapRover, will start deploying all services.

*Note: For faster deployment, nothing is built. All images are pulled from DockerHub. The images for `web`, `worker`, and `plugin` are from the `Dockerfile.caprover` file.*

After deployment, hit `finnish` and headover to the web service (Django) and navigate to `Deployment` page.

You'll see migration's running for Postgres and Clickhouse database. While these migrations are running you're not able to connect PostHog. Wait a few minutes and you'll see in the logs `posthog started`. After all migrations are setup, `worker` and `plugin` services will also launch.

Navigate to the `web` service http link and PostHog Preflight page will show up. If you see 502 http error, most likely, PostHog is still initializing.


##  Services
* Kafka: A distributed event streaming platform used to handle real-time data. A key component in PostHog event ingestion service. Events are written to the Kafka topics and then pulled by other services (Clickhouse, Plugin-server)

* Zookeeper: A centralized service for maintaining configuration information, naming and for coordinating Kafka and ClickHouse clusters

* ClickHouse - Used for storing big data, such as events and analytics queries.

* Postgres - stores data such as users, projects, insights, dashboards.

* Redis – for caching and inter-service communication

Then we have the four main PostHog components:

* Web server running Django amd API for users and Frontend - running under the web service
* Plugin server to handle event ingestion and apps/plugins (GeoIP for instance)
* Celery Worker: for background tasks

# CD

The `cd-deploy.yml` file provides a straightforward example of a continuous deployment setup. This configuration automatically updates three services:

    Web
    Plugin Server
    Worker

The process involves building the PostHog-LLM Docker image and pushing it to DockerHub. Each service is then deployed to its respective CapRover app. The command executed for each service is defined by the `APP_COMMAND` environment variable, which is set in the Apps Config tab of the CapRover dashboard.

To use this workflow, the user must:

* Specify the CapRover server URL in the format http://captain.your-domain.com.
* Store the app names and their corresponding tokens as secrets. Check Deployment tab in your CapRover apps.
* Provide Docker credentials for logging into the container registry (username and token).

