import { actions, afterMount, connect, kea, path, selectors } from 'kea'
import { loaders } from 'kea-loaders'
import api from 'lib/api'
import { pluginsLogic } from 'scenes/plugins/pluginsLogic'
import { urls } from 'scenes/urls'
import { userLogic } from 'scenes/userLogic'

import { PluginConfigTypeNew } from '~/types'

import { pipelineTransformationsLogic } from '../../pipeline/transformationsLogic'
import { RenderApp } from '../../pipeline/utils'
import type { exportsUnsubscribeTableLogicType } from './exportsUnsubscribeTableLogicType'

export interface ItemToDisable {
    plugin_config_id: number | undefined // exactly one of plugin_config_id or batch_export_id is set
    batch_export_id: string | undefined
    url: string
    team_id: number
    name: string
    description: string | undefined
    icon: JSX.Element
    disabled: boolean
}

export const exportsUnsubscribeTableLogic = kea<exportsUnsubscribeTableLogicType>([
    path(['scenes', 'pipeline', 'ExportsUnsubscribeTableLogic']),
    connect({
        values: [pluginsLogic, ['plugins'], pipelineTransformationsLogic, ['canConfigurePlugins'], userLogic, ['user']],
    }),

    actions({
        disablePlugin: (id: number) => ({ id }),
    }),
    loaders(({ values }) => ({
        pluginConfigsToDisable: [
            {} as Record<PluginConfigTypeNew['id'], PluginConfigTypeNew>,
            {
                loadPluginConfigs: async () => {
                    const res = await api.get<PluginConfigTypeNew[]>(
                        `api/organizations/@current/plugins/exports_unsubscribe_configs`
                    )
                    return Object.fromEntries(res.map((pluginConfig) => [pluginConfig.id, pluginConfig]))
                },
                disablePlugin: async ({ id }) => {
                    if (!values.canConfigurePlugins) {
                        return values.pluginConfigsToDisable
                    }
                    const response = await api.update(`api/plugin_config/${id}`, { enabled: false, deleted: true })
                    return { ...values.pluginConfigsToDisable, [id]: response }
                },
            },
        ],
    })),
    selectors({
        loading: [(s) => [s.pluginConfigsToDisableLoading], (pluginConfigsLoading) => pluginConfigsLoading],
        unsubscribeDisabledReason: [
            (s) => [s.loading, s.pluginConfigsToDisable],
            (loading, pluginConfigsToDisable) => {
                // TODO: check for permissions first - that the user has access to all the projects for this org
                return loading
                    ? 'Loading...'
                    : Object.values(pluginConfigsToDisable).some((pluginConfig) => pluginConfig.enabled)
                    ? 'All apps above must be disabled first'
                    : null
            },
        ],
        itemsToDisable: [
            (s) => [s.pluginConfigsToDisable, s.plugins],
            (pluginConfigsToDisable, plugins) => {
                const pluginConfigs = Object.values(pluginConfigsToDisable).map((pluginConfig) => {
                    return {
                        plugin_config_id: pluginConfig.id,
                        team_id: pluginConfig.team_id,
                        name: pluginConfig.name,
                        description: pluginConfig.description,
                        icon: <RenderApp plugin={plugins[pluginConfig.plugin]} imageSize="small" />,
                        disabled: !pluginConfig.enabled,
                        url: urls.projectApp(pluginConfig.plugin),
                    } as ItemToDisable
                })
                return [...pluginConfigs]
            },
        ],
    }),
    afterMount(({ actions }) => {
        actions.loadPluginConfigs()
        actions.loadBatchExportConfigs()
    }),
])
