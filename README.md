<p align="center">
  <img alt="posthoglogo" src="https://user-images.githubusercontent.com/65415371/205059737-c8a4f836-4889-4654-902e-f302b187b6a0.png">
</p>
<p align="center">
  <a href="https://discord.gg/uNurWjDkke">
        <img alt="Discord Community" src="https://dcbadge.limes.pink/api/server/https://discord.gg/uNurWjDkke&?style=flat-square">
  <!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
<a href='https://posthog.com/contributors'><img src='https://img.shields.io/badge/all_contributors-251-orange.svg?style=flat-square' /></a>
<!-- ALL-CONTRIBUTORS-BADGE:END -->
  <a href='http://makeapullrequest.com'><img alt='PRs Welcome' src='https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=shields'/></a>
  <img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/posthog/posthog"/>
  <img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/m/posthog/posthog"/>
  <img alt="GitHub closed issues" src="https://img.shields.io/github/issues-closed/posthog/posthog"/>
</p>

<p align="center">
  <a href="https://posthog.com/docs">Docs</a> - <a href="https://posthog.com/community">Community</a> - <a href="https://posthog.com/roadmap">Roadmap</a> - <a href="https://posthog.com/changelog">Changelog</a> - <a href="https://github.com/PostHog/posthog/issues/new?assignees=&labels=bug&template=bug_report.md">Bug reports</a> 
</p>

## PostHog-LLM

PostHog-LLM is a fork of [PostHog](https://github.com/PostHog/posthog) with extensions 
to use PostHog as a LLM text analytics platform and be able to display the LLM 
interactions while exploring insights. Understand user behavior interacting with your LLMs to gain insights into their preferences, identify patterns and discover how you can improve your LLMs products to better serve your users. 

## Get started

### Self-hosted


#### Deploy with CapRover

Faster and easier deployments. Check out [caprover](./caprover/) folder to deploy in minutes! ⚡

#### Hobby script
You can deploy a hobby instance in one line on Linux with Docker (recommended 4GB memory) (**requires building the image**):

```bash 
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/postlang/posthog-llm/HEAD/bin/deploy-hobby)"
 ```


## Uploading data

To start uploading some user-LLM interactions to PostHog-LLM, checkout our [demo-data](demo_upload) folder or check out our [repository](https://github.com/postlang/posthog-llm-examples) with examples on how to upload data to PostHog-LLM.

## Install Plugins

To maximize the capabilities of PostHog-LLM for analytics in LLMs, it's important to augment LLM interactions with additional metadata. This enhancement can be done through the deployment of machine learning models as PostHog plugins. Examples of such plugins, which are available in their respective repositories, include:

LLM conversation flow classifier: Enhances understanding of the conversation with specific agent and user flow labels.

* Plugin: https://github.com/minuva/ph-flowdetect-plugin

* Model: https://github.com/minuva/llm-flow-classification

Emotion classifier: Identifies emotions in text, providing a deeper insight into the emotional context of interactions.

* Plugin: https://github.com/minuva/ph-emotion-plugin

* Model: https://github.com/minuva/fast-nlp-text-emotion

Toxicity classifier: Detects toxic content in text, allowing for a safer and more positive user experience.

* Plugin: https://github.com/minuva/ph-toxicity-plugin

* Model: https://github.com/minuva/fast-nlp-text-toxicity

Prompt attack detection: Detects prompt attacks in text, providing a safeguard against malicious behavior.

* Plugin: https://github.com/minuva/ph-prompt-attack-detect-plugin
* Model: https://github.com/minuva/fast-prompt-attack-detect


These plugins link the PostHog data ingestion process with the machine learning models. These models need to be hosted on separate servers, a setup process that is detailed within each model's repository.

To install a plugin, navigate to the `Data Pipeline` section within the PostHog-LLM user interface, select the 'Manage apps tab' tab, click on `Install app advanced button` and enter the GitHub repository URL of the plugin into the designated field. This action will fetch the plugin's code from GitHub and initiate its installation. Hit the `Save` button and then go to the `Apps` tab to specify the address and port of your model server in the `API_SERVER_URL` (e.g. `http://localhost:9612`) field.

PostHog's plugin system is designed to facilitate the configuration of a model pipeline, enabling sequential data processing where each model can access and use properties appended by preceding models. The order of these models, as displayed in the PostHog UI, is important for ensuring that each model operates on the enriched dataset provided by its predecessors. PostHog-LLM adheres to a naming convention for LLM properties, and the machine learning models above are triggered exclusively for LLM events that include interaction texts.


## PostHog is an all-in-one, open source platform for building better products

- Specify events manually, or use autocapture to get started quickly
- Analyze data with ready-made visualizations, or do it yourself with SQL
- Gather insights by capturing session replays, console logs, and network monitoring
- Improve your product with A/B testing that automatically analyzes performance
- Safely roll out features to select users or cohorts with feature flags
- Send out fully customizable surveys to specific cohorts of users
- Connect to external services and manage data flows with PostHog CDP

## Table of Contents

- [Docs](#docs)
- [Contributing](#contributing)
- [Philosophy](#philosophy)
- [Open-source vs paid](#open-source-vs-paid)


## Docs
![ui-demo](https://github.com/AndrMoura/postlang-upload-data-script/assets/8346098/361cbf12-f6e1-47de-ae90-6c1fcc5606ac)
<p align="center">Want to find out more? <a href="https://posthog.com/book-a-demo">Request a demo!</a>

PostHog brings all the tools and data you need to build better products.

### Analytics and optimization tools

- **Event-based analytics:** Capture your product's usage [automatically](https://posthog.com/docs/integrate/client/js#autocapture), or [customize](https://posthog.com/docs/integrate) it to your needs
- **User and group tracking:** Understand the [people](https://posthog.com/manual/persons) and [groups](https://posthog.com/manual/group-analytics) behind the events and track properties about them
- **Data visualizations:** Create and share [graphs](https://posthog.com/docs/features/trends), [funnels](https://posthog.com/docs/features/funnels), [paths](https://posthog.com/docs/features/paths), [retention](https://posthog.com/docs/features/retention), and [dashboards](https://posthog.com/docs/features/dashboards)
- **SQL access:** Use [SQL](https://posthog.com/docs/product-analytics/sql) to get a deeper understanding of your users, breakdown information and create completely tailored visualizations
- **Session replays:** [Watch videos](https://posthog.com/docs/features/session-recording) of your users' behavior, with fine-grained filters and privacy controls, as well as network monitoring and captured console logs
- **Heatmaps:** See where users click and get a visual representation of their behaviour with the [PostHog Toolbar](https://posthog.com/docs/features/toolbar)
- **Feature flags:** Test and manage the rollout of [new features](https://posthog.com/docs/feature-flags/installation) to specific users and groups, or deploy flags as kill-switches
- **A/B and multivariate experimentation:** run simple or complex changes as [experiments](https://posthog.com/manual/experimentation) and get automatic significance calculations
- **Correlation analysis:** Discover what events and properties [correlate](https://posthog.com/manual/correlation) with success and failure
- **Surveys:** Collect qualitative feedback from your users using fully customizable [surveys](https://posthog.com/docs/surveys/installation)

### Data and infrastructure tools

- **Import and export your data:** Import from and export to the services that matter to you with [the PostHog CDP](https://posthog.com/docs/cdp)
- **Ready-made libraries:** We’ve built libraries for [JavaScript](https://posthog.com/docs/libraries/js), [Python](https://posthog.com/docs/libraries/python), [Ruby](https://posthog.com/docs/libraries/ruby), [Node](https://posthog.com/docs/libraries/node), [Go](https://posthog.com/docs/libraries/go), [Android](https://posthog.com/docs/libraries/android), [iOS](https://posthog.com/docs/libraries/ios), [PHP](https://posthog.com/docs/libraries/php), [Flutter](https://posthog.com/docs/libraries/flutter), [React Native](https://posthog.com/docs/libraries/react-native), [Elixir](https://posthog.com/docs/libraries/elixir), [Nim](https://github.com/Yardanico/posthog-nim), and an [API](https://posthog.com/docs/api) for anything else
- **Plays nicely with data warehouses:** import events or user data from your warehouse by writing a simple transformation plugin, and export data with pre-built apps - such as [BigQuery](https://posthog.com/apps/bigquery-export), [Redshift](https://posthog.com/apps/redshift-export), [Snowflake](https://posthog.com/apps/snowflake-export), and [S3](https://posthog.com/apps/s3-expo)

[Read a full list of PostHog features](https://posthog.com/product).

## Contributing

We <3 contributions big and small. In priority order (although everything is appreciated) with the most helpful first:

- Vote on features or get early access to beta functionality in our [roadmap](https://posthog.com/roadmap)
- Open a PR (see our instructions on [developing PostHog locally](https://posthog.com/handbook/engineering/developing-locally))
- Submit a [feature request](https://github.com/PostHog/posthog/issues/new?assignees=&labels=enhancement%2C+feature&template=feature_request.md) or [bug report](https://github.com/PostHog/posthog/issues/new?assignees=&labels=bug&template=bug_report.md)

## Philosophy

Our mission is to increase the number of successful products in the world. To do that, we build product and data tools that help you understand user behavior without losing control of your data.

In our view, third-party analytics tools do not work in a world of cookie deprecation, GDPR, HIPAA, CCPA, and many other four-letter acronyms. PostHog is the alternative to sending all of your customers' personal information and usage data to third-parties.

PostHog gives you every tool you need to understand user behavior, develop and test improvements, and release changes to make your product more successful.

PostHog operates in public as much as possible. We detail how we work and our learning on building and running a fast-growing, product-focused startup in our [handbook](https://posthog.com/handbook/getting-started/start-here).

## Open-source vs. paid

This repo is available under the [MIT expat license](https://github.com/PostHog/posthog/blob/master/LICENSE), except for the `ee` directory (which has it's [license here](https://github.com/PostHog/posthog/blob/master/ee/LICENSE)) if applicable. 

Need *absolutely 💯% FOSS*? Check out our [posthog-foss](https://github.com/PostHog/posthog-foss) repository, which is purged of all proprietary code and features.

To learn more, [book a demo](https://posthog.com/book-a-demo) or see our [pricing page](https://posthog.com/pricing).

## Contributors 🦸

Check the PostHog repository for more details all for the list of authors and contributors.
