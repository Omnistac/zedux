import { KeyboardEvent } from 'react'
import { ReactEditor } from 'slate-react'
import { Transforms } from 'slate'

const openingChars = ['{', '[', '(', '<']
const closingChars = ['}', ']', ')', '>']

export const onKeyDown = (
  editor: ReactEditor,
  event: KeyboardEvent<HTMLDivElement>
) => {
  if (event.key === 'Tab') {
    event.preventDefault()

    editor.insertText('  ')

    return
  }

  if (event.key === '{') {
    event.preventDefault()
    editor.insertText('{}')
    Transforms.move(editor, {
      distance: 1,
      reverse: true,
      unit: 'character',
    })
    return
  }

  if (event.key === '[') {
    event.preventDefault()
    editor.insertText('[]')
    Transforms.move(editor, {
      distance: 1,
      reverse: true,
      unit: 'character',
    })
    return
  }

  if (event.key === '(') {
    event.preventDefault()
    editor.insertText('()')
    Transforms.move(editor, {
      distance: 1,
      reverse: true,
      unit: 'character',
    })
    return
  }

  const domRange =
    editor.selection && ReactEditor.toDOMRange(editor, editor.selection)

  if (!domRange) return

  let line = domRange.startContainer.parentElement
  while (line.dataset.slateNode !== 'text') {
    line = line.parentElement
  }

  const lineText = line.innerText
  const spaces = lineText.match(/^ +/)?.[0] || ''
  const hasSelection = domRange.startOffset !== domRange.endOffset
  const endOffset = hasSelection
    ? domRange.endOffset
    : editor.selection.focus.offset
  const startOffset = hasSelection ? domRange.startOffset : endOffset
  const prevChar = lineText[startOffset - 1] || ''
  const nextChar = lineText[endOffset] || ''

  if (
    (event.key === '}' && nextChar === '}') ||
    (event.key === ']' && nextChar === ']') ||
    (event.key === ')' && nextChar === ')') ||
    (event.key === '"' && nextChar === '"') ||
    (event.key === "'" && nextChar === "'") ||
    (event.key === '`' && nextChar === '`')
  ) {
    event.preventDefault()
    Transforms.move(editor, {
      distance: 1,
      unit: 'character',
    })
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    editor.insertBreak()

    if (openingChars.includes(prevChar)) {
      editor.insertText(`${spaces}  `)

      if (closingChars.includes(nextChar)) {
        editor.insertBreak()
        editor.insertText(spaces)
        Transforms.move(editor, {
          distance: spaces.length + 1,
          reverse: true,
          unit: 'character',
        })
      }

      return
    }

    editor.insertText(spaces)

    return
  }
}

export const scrollSelectionIntoView = (
  editor: ReactEditor,
  domRange: Range
) => {
  const el = domRange.startContainer.parentElement
  let editorEl = domRange.startContainer.parentElement

  while (!editorEl.dataset.slateEditor) {
    editorEl = editorEl.parentElement
  }

  const charWidth = el.getBoundingClientRect().width / el.innerText.length

  const prevPos = editorEl.scrollLeft
  domRange.startContainer.parentElement.scrollIntoView({
    block: 'nearest',
  })

  if (!charWidth) {
    // this means the current line is empty - set scrollPos to the far left
    editorEl.scrollLeft = 0
    return
  }

  const width = editorEl.clientWidth
  const charNum = editor.selection.focus.offset
  const offset = charNum * charWidth
  const BUFFER = 24

  if (offset + (BUFFER + 8) - width > prevPos) {
    // move right
    editorEl.scrollLeft = offset + (BUFFER + 8) - width
  } else if (offset - (BUFFER - 8) < prevPos) {
    // move left
    editorEl.scrollLeft = offset - (BUFFER - 8)
  } else {
    editorEl.scrollLeft = prevPos
  }
}
