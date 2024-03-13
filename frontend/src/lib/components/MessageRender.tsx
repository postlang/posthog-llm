import { memo } from 'react'
import LemonMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

export const MessageRender = memo((props) => {
    return (
        <LemonMarkdown className="z-ui-markdown" remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}>
            {props.children}
        </LemonMarkdown>
    )
})

MessageRender.displayName = 'MessageRender'
export default MessageRender
