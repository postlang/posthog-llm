import './PersonsModal.scss'

import { IconCollapse, IconExpand } from '@posthog/icons'
import {
    LemonBadge,
    LemonBanner,
    LemonButton,
    LemonDivider,
    LemonInput,
    LemonModal,
    LemonModalProps,
    LemonSelect,
    LemonSkeleton,
    Link,
} from '@posthog/lemon-ui'
import { useActions, useValues } from 'kea'
import { CopyToClipboardInline } from 'lib/components/CopyToClipboard'
import { exportsLogic } from 'lib/components/ExportButton/exportsLogic'
import { MessageRender } from 'lib/components/MessageRender'
import { PropertiesTable } from 'lib/components/PropertiesTable'
import { PropertiesTimeline } from 'lib/components/PropertiesTimeline'
import { IconPlayCircle } from 'lib/lemon-ui/icons'
import { IconPerson, IconRobot } from 'lib/lemon-ui/icons'
import { LemonTabs } from 'lib/lemon-ui/LemonTabs'
import { ProfilePicture } from 'lib/lemon-ui/ProfilePicture'
import { Spinner } from 'lib/lemon-ui/Spinner/Spinner'
import { Tooltip } from 'lib/lemon-ui/Tooltip'
import { capitalizeFirstLetter, isGroupType, midEllipsis, pluralize } from 'lib/utils'
import { useCallback, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { InsightErrorState, InsightValidationError } from 'scenes/insights/EmptyStates'
import { isOtherBreakdown } from 'scenes/insights/utils'
import { GroupActorDisplay, groupDisplayId } from 'scenes/persons/GroupActorDisplay'
import { asDisplay } from 'scenes/persons/person-utils'
import { PersonDisplay } from 'scenes/persons/PersonDisplay'
import { SessionPlayerModal } from 'scenes/session-recordings/player/modal/SessionPlayerModal'
import { sessionPlayerModalLogic } from 'scenes/session-recordings/player/modal/sessionPlayerModalLogic'
import { teamLogic } from 'scenes/teamLogic'

import { Noun } from '~/models/groupsModel'
import {
    ActorType,
    ExporterFormat,
    PropertiesTimelineFilterType,
    PropertyDefinitionType,
    SessionRecordingType,
} from '~/types'

import { PersonModalLogicProps, personsModalLogic } from './personsModalLogic'
import { SaveCohortModal } from './SaveCohortModal'

export interface PersonsModalProps extends PersonModalLogicProps, Pick<LemonModalProps, 'inline'> {
    onAfterClose?: () => void
    urlsIndex?: number
    urls?: {
        label: string | JSX.Element
        value: string
    }[]
    title: React.ReactNode | ((actorLabel: string) => React.ReactNode)
}

export function PersonsModal({
    url: _url,
    urlsIndex,
    urls,
    query: _query,
    title,
    onAfterClose,
    inline,
    additionalSelect,
    orderBy,
}: PersonsModalProps): JSX.Element {
    const [selectedUrlIndex, setSelectedUrlIndex] = useState(urlsIndex || 0)
    const originalUrl = (urls || [])[selectedUrlIndex]?.value || _url || ''

    const logic = personsModalLogic({
        url: originalUrl,
        query: _query,
        additionalSelect,
        orderBy,
    })

    const {
        query,
        actors,
        actorsResponseLoading,
        actorsResponse,
        errorObject,
        validationError,
        insightActorsQueryOptions,
        searchTerm,
        actorLabel,
        isCohortModalOpen,
        isModalOpen,
        missingActorsCount,
        propertiesTimelineFilterFromUrl,
        exploreUrl,
        actorsQuery,
    } = useValues(logic)
    const { updateActorsQuery, setSearchTerm, saveAsCohort, setIsCohortModalOpen, closeModal, loadNextActors } =
        useActions(logic)
    const { openSessionPlayer } = useActions(sessionPlayerModalLogic)
    const { currentTeam } = useValues(teamLogic)
    const { startExport } = useActions(exportsLogic)

    const totalActorsCount = missingActorsCount + actors.length

    const getTitle = useCallback(() => {
        if (typeof title === 'function') {
            return title(capitalizeFirstLetter(actorLabel.plural))
        }

        if (isOtherBreakdown(title)) {
            return 'Other'
        }

        return title
    }, [title, actorLabel.plural])

    return (
        <>
            <LemonModal
                title={null}
                isOpen={isModalOpen}
                onClose={closeModal}
                onAfterClose={onAfterClose}
                simple
                width={560}
                inline={inline}
            >
                <LemonModal.Header>
                    <h3>{getTitle()}</h3>
                </LemonModal.Header>
                <div className="px-4 py-2">
                    {actorsResponse && !!missingActorsCount && (
                        <MissingPersonsAlert actorLabel={actorLabel} missingActorsCount={missingActorsCount} />
                    )}
                    <LemonInput
                        type="search"
                        placeholder="Search for persons by email, name, or ID"
                        fullWidth
                        value={searchTerm}
                        onChange={setSearchTerm}
                        className="my-2"
                    />

                    {urls ? (
                        <LemonSelect
                            fullWidth
                            className="mb-2"
                            value={selectedUrlIndex}
                            onChange={(v) => {
                                if (v !== null && v >= 0) {
                                    setSelectedUrlIndex(v)
                                }
                            }}
                            options={(urls || []).map((url, index) => ({
                                value: index,
                                label: url.label,
                            }))}
                        />
                    ) : null}

                    {query &&
                        Object.entries(insightActorsQueryOptions ?? {})
                            .filter(([, value]) => {
                                if (Array.isArray(value)) {
                                    return !!value.length
                                }

                                return !!value
                            })
                            .map(([key, options]) => (
                                <div key={key}>
                                    <LemonSelect
                                        fullWidth
                                        className="mb-2"
                                        value={query?.[key] ?? null}
                                        onChange={(v) => updateActorsQuery({ [key]: v })}
                                        options={options}
                                    />
                                </div>
                            ))}

                    <div className="flex items-center gap-2 text-muted">
                        {actorsResponseLoading ? (
                            <>
                                <Spinner />
                                <span>Loading {actorLabel.plural}...</span>
                            </>
                        ) : (
                            <span>
                                {actorsResponse?.next || actorsResponse?.offset ? 'More than ' : ''}
                                <b>
                                    {totalActorsCount || 'No'} unique{' '}
                                    {pluralize(totalActorsCount, actorLabel.singular, actorLabel.plural, false)}
                                </b>
                            </span>
                        )}
                    </div>
                </div>
                <div className="px-4 overflow-hidden flex flex-col">
                    <div className="relative min-h-20 p-2 space-y-2 rounded bg-border-light overflow-y-auto mb-2">
                        {errorObject ? (
                            validationError ? (
                                <InsightValidationError detail={validationError} />
                            ) : (
                                <InsightErrorState />
                            )
                        ) : actors && actors.length > 0 ? (
                            <>
                                {actors.map((actor) => (
                                    <ActorRow
                                        key={actor.id}
                                        actor={actor}
                                        onOpenRecording={(sessionRecording) => {
                                            openSessionPlayer(sessionRecording)
                                        }}
                                        propertiesTimelineFilter={
                                            actor.type == 'person' && currentTeam?.person_on_events_querying_enabled
                                                ? propertiesTimelineFilterFromUrl
                                                : undefined
                                        }
                                    />
                                ))}
                            </>
                        ) : actorsResponseLoading ? (
                            <div className="space-y-3">
                                <LemonSkeleton active={false} className="h-4 w-full" />
                                <LemonSkeleton active={false} className="h-4 w-3/5" />
                            </div>
                        ) : (
                            <div className="text-center p-5">
                                We couldn't find any matching {actorLabel.plural} for this data point.
                            </div>
                        )}

                        {(actorsResponse?.next || actorsResponse?.offset) && (
                            <div className="m-4 flex justify-center">
                                <LemonButton type="primary" onClick={loadNextActors} loading={actorsResponseLoading}>
                                    Load more {actorLabel.plural}
                                </LemonButton>
                            </div>
                        )}
                    </div>
                </div>
                <LemonModal.Footer>
                    <div className="flex justify-between gap-2 w-full">
                        <div className="flex gap-2">
                            <LemonButton
                                type="secondary"
                                onClick={() => {
                                    startExport({
                                        export_format: ExporterFormat.CSV,
                                        export_context: query
                                            ? { source: actorsQuery as Record<string, any> }
                                            : { path: originalUrl },
                                    })
                                }}
                                data-attr="person-modal-download-csv"
                                disabled={!actors.length}
                            >
                                Download CSV
                            </LemonButton>
                            {actors && actors.length > 0 && !isGroupType(actors[0]) && (
                                <LemonButton
                                    onClick={() => setIsCohortModalOpen(true)}
                                    type="secondary"
                                    data-attr="person-modal-save-as-cohort"
                                    disabled={!actors.length}
                                >
                                    Save as cohort
                                </LemonButton>
                            )}
                        </div>
                        {exploreUrl && (
                            <LemonButton
                                type="primary"
                                to={exploreUrl}
                                data-attr="person-modal-new-insight"
                                onClick={() => {
                                    closeModal()
                                }}
                            >
                                Explore
                            </LemonButton>
                        )}
                    </div>
                </LemonModal.Footer>
            </LemonModal>
            <SaveCohortModal
                onSave={(title) => saveAsCohort(title)}
                onCancel={() => setIsCohortModalOpen(false)}
                isOpen={isCohortModalOpen}
            />
            <SessionPlayerModal />
        </>
    )
}

function getSessionId(event: Record<string, string>): string {
    return event['$session_id'] ? event['$session_id'] : ``
}

function processArrayInput(event: [], timestamp: any, output: string): ProcessedMessage {
    // This function processes the array input when a session ID is present,

    const lastInput = event[event.length - 1]
    const history = event.slice(0, event.length - 1)

    const processedHistory = []

    for (let i = 0; i < history.length; i += 2) {
        const hisCurrent = history[i]

        const processedItem = {
            input: hisCurrent['content'],
            output: history[i + 1]['content'],
            timestamp: hisCurrent['timestamp'],
        }
        processedHistory.push(processedItem)
    }

    return {
        input: lastInput['content'],
        output: output,
        timestamp: timestamp,
        history: processedHistory,
    }
}

type ProcessedMessage = {
    input: string
    output: string
    timestamp: string
    history?: ProcessedMessage[]
    metadata?: Record<string, any>
}

function processStringInput(event: Record<string, any>, allEvents: []): ProcessedMessage {
    const msg = {
        input: event['$llm_input'],
        timestamp: event['timestamp'],
        output: event['$llm_output'],
    }

    // add metadata to the message
    const metadata = {}
    Object.keys(event).forEach((key) => {
        if (key.startsWith('user_') || key.startsWith('agent_')) {
            metadata[key] = event[key]
        }
    })
    msg['metadata'] = metadata

    // find the history of the current event
    const history = allEvents.filter(
        (e) => e['$session_id'] === event['$session_id'] && e['timestamp'] < event['timestamp']
    )

    if (history.length) {
        msg['history'] = history.map((h) => ({
            input: h['$llm_input'],
            output: h['$llm_output'],
            timestamp: h['timestamp'],
        }))
    }

    return msg
}

function addTaskToDialogues(
    dialogues: Record<string, Array<unknown>>,
    sessionId: string,
    event: Record<string, unknown>,
    llmEvents: []
): void {
    if (!dialogues[sessionId]) {
        dialogues[sessionId] = []
    }
    let task = null
    if (Array.isArray(event['$llm_input'])) {
        task = processArrayInput(event['$llm_input'] as [], event['timestamp'], event['$llm_output'] as string)
    } else if (typeof event['$llm_input'] === 'string') {
        task = processStringInput(event, llmEvents)
    }
    dialogues[sessionId].push(task)
}

function preProcessEvents(llmEvents: []): Record<string, unknown> {
    /* Preprocess the events to segment them by session ID */
    const segmentedDialogues = {}

    llmEvents.forEach((event: Record<string, string>) => {
        const sessionId = getSessionId(event)
        addTaskToDialogues(segmentedDialogues, sessionId, event, llmEvents)
    })

    return segmentedDialogues
}

interface ActorRowProps {
    actor: ActorType
    onOpenRecording: (sessionRecording: Pick<SessionRecordingType, 'id' | 'matching_events'>) => void
    propertiesTimelineFilter?: PropertiesTimelineFilterType
}

export function ActorRow({ actor, onOpenRecording, propertiesTimelineFilter }: ActorRowProps): JSX.Element {
    const [expanded, setExpanded] = useState(false)

    const { ['$llm-events']: convs, ...remaining_props } = actor.properties
    let segmentedConvs = {}
    if (convs) {
        // @ts-expect-error
        segmentedConvs = preProcessEvents(convs, actor.distinct_ids[0])
    }

    const [tab, setTab] = useState('properties')
    const name = isGroupType(actor) ? groupDisplayId(actor.group_key, actor.properties) : asDisplay(actor)

    const onOpenRecordingClick = (): void => {
        if (!actor.matched_recordings) {
            return
        }
        if (actor.matched_recordings?.length > 1) {
            setExpanded(true)
            setTab('recordings')
        } else {
            actor.matched_recordings[0].session_id &&
                onOpenRecording({
                    id: actor.matched_recordings[0].session_id,
                    matching_events: actor.matched_recordings,
                })
        }
    }

    const matchedRecordings = actor.matched_recordings || []

    return (
        <div className="relative border rounded bg-bg-light">
            <div className="flex items-center gap-2 p-2">
                <LemonButton
                    noPadding
                    active={expanded}
                    onClick={() => setExpanded(!expanded)}
                    icon={expanded ? <IconCollapse /> : <IconExpand />}
                    title={expanded ? 'Show less' : 'Show more'}
                    data-attr={`persons-modal-expand-${actor.id}`}
                />

                <ProfilePicture name={name} size="md" />

                <div className="flex-1 overflow-hidden">
                    {isGroupType(actor) ? (
                        <div className="font-bold">
                            <GroupActorDisplay actor={actor} />
                        </div>
                    ) : (
                        <>
                            <div className="font-bold flex items-start">
                                <PersonDisplay person={actor} withIcon={false} />
                            </div>
                            {actor.distinct_ids?.[0] && (
                                <CopyToClipboardInline
                                    explicitValue={actor.distinct_ids[0]}
                                    iconStyle={{ color: 'var(--primary)' }}
                                    iconPosition="end"
                                    className="text-xs text-muted-alt"
                                >
                                    {midEllipsis(actor.distinct_ids[0], 32)}
                                </CopyToClipboardInline>
                            )}
                        </>
                    )}
                </div>

                {matchedRecordings.length && matchedRecordings.length > 0 ? (
                    <div className="shrink-0">
                        <LemonButton
                            onClick={onOpenRecordingClick}
                            sideIcon={matchedRecordings.length === 1 ? <IconPlayCircle /> : null}
                            type="secondary"
                            size="small"
                        >
                            {matchedRecordings.length > 1 ? `${matchedRecordings.length} recordings` : 'View recording'}
                        </LemonButton>
                    </div>
                ) : null}
            </div>

            {expanded ? (
                <div className="PersonsModal__tabs bg-side border-t rounded-b">
                    <LemonTabs
                        activeKey={tab}
                        onChange={setTab}
                        tabs={[
                            {
                                key: 'properties',
                                label: 'Properties',
                                content: propertiesTimelineFilter ? (
                                    <PropertiesTimeline actor={actor} filter={propertiesTimelineFilter} />
                                ) : (
                                    <PropertiesTable
                                        type={actor.type /* "person" or "group" */ as PropertyDefinitionType}
                                        properties={remaining_props}
                                    />
                                ),
                            },
                            {
                                key: 'recordings',
                                label: 'Recordings',
                                content: (
                                    <div className="p-2 space-y-2 font-medium mt-1">
                                        <div className="flex justify-between items-center px-2">
                                            <span>{pluralize(matchedRecordings.length, 'matched recording')}</span>
                                        </div>
                                        <ul className="space-y-px">
                                            {matchedRecordings?.length
                                                ? matchedRecordings.map((recording, i) => (
                                                      <>
                                                          <LemonDivider className="my-0" />
                                                          <li key={i}>
                                                              <LemonButton
                                                                  key={i}
                                                                  fullWidth
                                                                  onClick={() => {
                                                                      recording.session_id &&
                                                                          onOpenRecording({
                                                                              id: recording.session_id,
                                                                              matching_events: [
                                                                                  {
                                                                                      events: recording.events,
                                                                                      session_id: recording.session_id,
                                                                                  },
                                                                              ],
                                                                          })
                                                                  }}
                                                              >
                                                                  <div className="flex flex-1 justify-between gap-2 items-center">
                                                                      <span>View recording {i + 1}</span>
                                                                      <IconPlayCircle className="text-xl text-muted" />
                                                                  </div>
                                                              </LemonButton>
                                                          </li>
                                                      </>
                                                  ))
                                                : null}
                                        </ul>
                                    </div>
                                ),
                            },
                            {
                                key: 'dialogs',
                                label: 'LLM Events',
                                content: (
                                    <div>
                                        <div className="p-2 space-y-2 font-medium mt-1">
                                            <div className="flex justify-between items-center px-2">
                                                <span>
                                                    {pluralize(Object.keys(segmentedConvs).length, 'matched session')}
                                                </span>
                                            </div>
                                            {Object.entries(segmentedConvs).map(([sessionId, conversation], index) => (
                                                <ConvRow
                                                    key={index}
                                                    convId={`Session - ${sessionId}`}
                                                    conversation={
                                                        conversation as {
                                                            input: string
                                                            output: string
                                                            timestamp: string
                                                            history: []
                                                            metadata: Record<string, any>
                                                        }[]
                                                    }
                                                    expand={Object.keys(segmentedConvs).length === 1}
                                                    setBorder={index !== Object.keys(segmentedConvs).length - 1} // Don't set border for the last conversation
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ),
                            },
                        ]}
                    />
                </div>
            ) : null}

            {actor.value_at_data_point !== null && (
                <Tooltip title={`${name}'s value for this data point.`}>
                    <LemonBadge.Number
                        count={actor.value_at_data_point}
                        maxDigits={Infinity}
                        position="top-right"
                        style={{ pointerEvents: 'auto' }}
                    />
                </Tooltip>
            )}
        </div>
    )
}

interface ConvRowProps {
    convId: string
    conversation: { input: string; output: string; timestamp: string; history: []; metadata: Record<string, any> }[]
    expand: boolean
    setBorder?: boolean
}

export function ConvRow({ convId, conversation, expand, setBorder }: ConvRowProps): JSX.Element {
    const previewText = conversation
        .map((task) => task.input + ' ' + task.output)
        .join(' ')
        .slice(0, 180)

    const [expanded, setExpanded] = useState(expand)
    const handleRowClick = (): void => {
        setExpanded(!expanded)
    }

    return (
        <div className="pt">
            <div
                className={`flex items-center gap-2 pb-1 cursor-pointer ${
                    setBorder && !expanded ? 'border-b border-gray-300' : ''
                }`}
                onClick={handleRowClick}
            >
                <LemonButton
                    onClick={() => setExpanded(!expanded)}
                    icon={expanded ? <IconCollapse /> : <IconExpand />}
                    title={expanded ? 'Show less' : 'Show more'}
                    data-attr={`persons-modal-expand-${convId}`}
                />
                {expanded ? (
                    <div className="flex-1 overflow-hidden ml-075">
                        <strong>{convId}</strong>
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden ml-075">
                        <strong>{convId}</strong> - {previewText + '...'}
                    </div>
                )}
            </div>
            {expanded && (
                <div className="p-2 font-medium mt-1">
                    {conversation.map((task, i) => (
                        <div key={i} className="mb-2">
                            <Task
                                input={task.input}
                                output={task.output}
                                timestamp={task.timestamp}
                                history={task.history}
                                isTask={true}
                                metadata={task.metadata}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

interface TaskProps {
    input: string
    output: string
    timestamp?: string
    history?: ProcessedMessage[]
    expandHistory?: boolean
    isTask?: boolean
    metadata?: Record<string, any>
}

export function Task({ input, output, timestamp, history, expandHistory, isTask, metadata }: TaskProps): JSX.Element {
    const user_class = 'user-avatar-div'
    const agent_class = 'agent-avatar-div'
    const user_metadata = {}
    const agent_metadata = {}

    if (metadata) {
        Object.keys(metadata).forEach((key) => {
            if (key.startsWith('user_')) {
                user_metadata[key] = metadata[key]
            } else if (key.startsWith('agent_')) {
                agent_metadata[key] = metadata[key]
            }
        })
    }

    const [expanded, setExpanded] = useState<boolean>(expandHistory || false)

    const toggleHistory = (): void => {
        setExpanded(!expanded)
    }

    return (
        <div className={isTask ? 'border' : ''}>
            {timestamp && (
                <div className={`flex justify-between pr-2 pl-2 ${expanded ? 'border-b' : ''}`}>
                    <span className="text-muted-alt">{new Date(timestamp).toLocaleString()}</span>
                    {history && history.length > 0 && (
                        <div onClick={toggleHistory} className="cursor-pointer mr-4">
                            {expanded ? 'Close Chat History' : `Open Chat History (${history.length})`}
                        </div>
                    )}
                </div>
            )}
            <div className="text-xs">
                {expanded &&
                    history &&
                    history.map((message, index) => (
                        <Task key={index} input={message.input} output={message.output} isTask={false} />
                    ))}
            </div>
            <div className={`pt ${isTask ? 'border-t' : ''}`}>
                <TaskRow
                    role="user"
                    avatarClass={user_class}
                    utterance={input}
                    isTask={isTask}
                    metadata={user_metadata}
                    addPaddingBot={true}
                />
                <TaskRow
                    role="agent"
                    avatarClass={agent_class}
                    utterance={output}
                    metadata={agent_metadata}
                    isTask={isTask}
                />
            </div>
        </div>
    )
}

interface TaskRowProps {
    role: string
    avatarClass: string
    utterance: string
    isTask?: boolean // is the row a task or a history message
    metadata?: Record<string, any>
    addPaddingBot?: boolean
}
export function TaskRow({ role, avatarClass, utterance, isTask, metadata, addPaddingBot }: TaskRowProps): JSX.Element {
    const clean_metadata = {}
    if (metadata) {
        Object.keys(metadata).forEach((key) => {
            if (metadata[key] !== 'OTHER') {
                clean_metadata[key] = metadata[key]
            }
        })
    }

    return (
        <div className={`w-full ${addPaddingBot && isTask ? 'pb-4' : 'pb-0'}`}>
            <div
                className={`rounded-lg ${isTask && role === 'user' ? 'border-b' : ''} ${
                    !isTask ? (role === 'user' ? 'px-4 pt-4' : role === 'agent' ? 'px-4' : '') : 'p-4'
                }`}
            >
                <div className="rounded-lg p-2 mb-2">
                    <div className="flex flex-row">
                        <div
                            className={`flex items-center justify-center ${
                                isTask ? 'w-9 h-9' : 'w-6 h-6'
                            } ${avatarClass} p-1`}
                        >
                            {role === 'user' ? (
                                <IconPerson className="avatar-style" />
                            ) : (
                                <IconRobot className="avatar-style" />
                            )}
                        </div>
                        <div className="ml-3 mr-3">
                            <MessageRender>{utterance}</MessageRender>
                        </div>
                    </div>

                    {clean_metadata && Object.keys(clean_metadata).length > 0 && (
                        <div className="metadata flex">
                            {Object.keys(clean_metadata).map((key) => (
                                <span key={key} className="metadata-pill border border-gray-300 rounded">
                                    {key + ': ' + clean_metadata[key]}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export function MissingPersonsAlert({
    actorLabel,
    missingActorsCount,
}: {
    actorLabel: Noun
    missingActorsCount: number
}): JSX.Element {
    return (
        <LemonBanner type="info" className="mb-2">
            {missingActorsCount} {missingActorsCount > 1 ? `${actorLabel.plural} are` : `${actorLabel.singular} is`} not
            shown because they've been merged with those listed, or deleted.{' '}
            <Link to="https://posthog.com/docs/how-posthog-works/queries#insights-counting-unique-persons">
                Learn more.
            </Link>
        </LemonBanner>
    )
}

export type OpenPersonsModalProps = Omit<PersonsModalProps, 'onClose' | 'onAfterClose'>

export const openPersonsModal = (props: OpenPersonsModalProps): void => {
    const div = document.createElement('div')
    const root = createRoot(div)
    function destroy(): void {
        root.unmount()
        if (div.parentNode) {
            div.parentNode.removeChild(div)
        }
    }

    document.body.appendChild(div)
    root.render(<PersonsModal {...props} onAfterClose={destroy} />)
}
