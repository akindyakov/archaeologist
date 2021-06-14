import React from 'react'

import { Descendant } from 'slate'

import {
  slateToMarkdown,
  markdownToSlate,
  kSlateBlockTypeH1,
  kSlateBlockTypeH2,
  kSlateBlockTypeH3,
  kSlateBlockTypeH4,
  kSlateBlockTypeH5,
  kSlateBlockTypeH6,
  kSlateBlockTypeBreak,
  kSlateBlockTypeCode,
  kSlateBlockTypeOrderedList,
  kSlateBlockTypeParagraph,
  kSlateBlockTypeQuote,
  kSlateBlockTypeUnorderedList,
  kSlateBlockTypeDateTime,
} from './slate'

test('Markdown to Slate state', async () => {
  const md = `
# Header 1
## Header 2
### Header 3
#### Header 4
##### Header 5
###### Header 6

- Schools
- [Travel history](wq8ksuip3t8x85eckumpsezhr4ek6qatraghtohr38khg)
- [Housing history](94ogoxqapi84je7hkbt1qtt8k1oeycqc43haij57pimhn)
- Passports

\`static_cast<typename std::remove_reference<T>::type&&>(t)\`

__Trees were swaying__

-----

\`\`\`python
s = "Python syntax highlighting"
print s
\`\`\`

| First H  | Second H |
| -------- | -------- |
| Cell 1-1 | Cell 1-2 |
| Cell 2-1 | Cell 2-2 |

> Blockquotes are very handy in email to emulate reply text.
> This line is part of the same quote.

- [ ] Checlist item 1
- [ ] Checlist item 2

1. Though gently
1. The ability to approach every
1. The protesters here certainly

![Stormtroopocat](https://octodex.github.com/images/stormtroopocat.jpg "The Stormtroopocat")

[](@1619823600/day)
`

  const value = await markdownToSlate(md)
  value.forEach((block) => {
    expect(block).toHaveProperty('type')
    expect(block).toHaveProperty('children')
  })
  expect(value[0].type).toStrictEqual(kSlateBlockTypeH1)
  expect(value[1].type).toStrictEqual(kSlateBlockTypeH2)
  expect(value[2].type).toStrictEqual(kSlateBlockTypeH3)
  expect(value[3].type).toStrictEqual(kSlateBlockTypeH4)
  expect(value[4].type).toStrictEqual(kSlateBlockTypeH5)
  expect(value[5].type).toStrictEqual(kSlateBlockTypeH6)
  expect(value[6].type).toStrictEqual(kSlateBlockTypeUnorderedList)
  expect(value[7].type).toStrictEqual(kSlateBlockTypeParagraph)
  expect(value[8].type).toStrictEqual(kSlateBlockTypeParagraph)
  expect(value[9].type).toStrictEqual(kSlateBlockTypeBreak)
  expect(value[10].type).toStrictEqual(kSlateBlockTypeCode)
  expect(value[11].type).toStrictEqual(kSlateBlockTypeParagraph)
  expect(value[12].type).toStrictEqual(kSlateBlockTypeQuote)
  expect(value[13].type).toStrictEqual(kSlateBlockTypeUnorderedList)
  expect(value[14].type).toStrictEqual(kSlateBlockTypeOrderedList)
  expect(value[15].type).toStrictEqual(kSlateBlockTypeParagraph)
  expect(value[16].type).toStrictEqual(kSlateBlockTypeParagraph)

  expect(value[0].children[0].text).toStrictEqual('Header 1')
  expect(value[1].children[0].text).toStrictEqual('Header 2')
  expect(value[2].children[0].text).toStrictEqual('Header 3')
  expect(value[3].children[0].text).toStrictEqual('Header 4')
  expect(value[4].children[0].text).toStrictEqual('Header 5')
  expect(value[5].children[0].text).toStrictEqual('Header 6')
})

test('Slate state to Markdown', () => {
  const headerText: string =
    '#0413321!149761a' +
    '23 # 43 c' +
    '24 $ 44 d' +
    '25 % 45 e' +
    '28 ( 50 h' +
    '29 ) 51 i' +
    '2A * 52 j' +
    '2B + 53 k'
  const paragraphText: string =
    '2C , 54 l' +
    '2D - 55 m' +
    '2E . 56 n' +
    '2F / 57 o' +
    '30 0 60 p' +
    '31 1 61 q' +
    '32 2 62 r' +
    '33 3 63 s' +
    '34 4 64 t' +
    '35 5 65 u' +
    '36 6 66 v' +
    '37 7 67 w' +
    '38 8 70 x' +
    '39 9 71 y' +
    `3A : 72 z` +
    '3B ; 73 {'
  const state: Descendant[] = [
    {
      type: kSlateBlockTypeH2,
      children: [
        {
          text: headerText,
        },
      ],
    },
    {
      type: kSlateBlockTypeParagraph,
      children: [
        {
          text: paragraphText,
        },
      ],
    },
  ]
  const md: string = slateToMarkdown(state)
  expect(md).toStrictEqual(`## ${headerText}\n${paragraphText}\n`)
})

test('Checklist in Markdown', async () => {
  const md: string = `
- [x] Drink a glass of water
- [X] Make your bed
- [ ] Get moving
- [ ] Stay unplugged
- [x] Sneak in a little me-time
  `
  const value = await markdownToSlate(md)
  expect(value.length).toStrictEqual(1)
  const { children, type } = value[0]
  expect(type).toStrictEqual(kSlateBlockTypeUnorderedList)
  expect(children.length).toStrictEqual(5)
  expect(children[0].checked).toStrictEqual(true)
  expect(children[1].checked).toStrictEqual(true)
  expect(children[2].checked).toStrictEqual(false)
  expect(children[3].checked).toStrictEqual(false)
  expect(children[4].checked).toStrictEqual(true)

  expect(children[0].children[0].children[0].text).toStrictEqual(
    'Drink a glass of water'
  )
  expect(children[1].children[0].children[0].text).toStrictEqual(
    'Make your bed'
  )
  expect(children[2].children[0].children[0].text).toStrictEqual('Get moving')
  expect(children[3].children[0].children[0].text).toStrictEqual(
    'Stay unplugged'
  )
  expect(children[4].children[0].children[0].text).toStrictEqual(
    'Sneak in a little me-time'
  )
})

test('Multi checklist in Markdown', async () => {
  const md: string = `
- [x] First
  - [x] aaa
  - [ ] bbb
  - [X] ccc
  - [x] ddd
- [ ] Second
  - [ ] AAA
  - [x] BBB
  - [X] CCC
  `
  const value = await markdownToSlate(md)
  expect(value.length).toStrictEqual(1)
  const { children, type } = value[0]
  expect(type).toStrictEqual(kSlateBlockTypeUnorderedList)
  expect(children.length).toStrictEqual(2)

  expect(children[0].children.length).toStrictEqual(2)
  expect(children[1].children.length).toStrictEqual(2)

  expect(children[0].children[0].children.length).toStrictEqual(1)
  expect(children[1].children[0].children.length).toStrictEqual(1)
  // 0
  expect(children[0].checked).toStrictEqual(true)
  expect(children[0].children[0].children[0].text).toStrictEqual('First')
  // 1
  expect(children[1].checked).toStrictEqual(false)
  expect(children[1].children[0].children[0].text).toStrictEqual('Second')
  // 0.0
  expect(children[0].children[1].children[0].checked).toStrictEqual(true)
  expect(
    children[0].children[1].children[0].children[0].children[0].text
  ).toStrictEqual('aaa')
  // 0.1
  expect(children[0].children[1].children[1].checked).toStrictEqual(false)
  expect(
    children[0].children[1].children[1].children[0].children[0].text
  ).toStrictEqual('bbb')
  // 0.2
  expect(children[0].children[1].children[2].checked).toStrictEqual(true)
  expect(
    children[0].children[1].children[2].children[0].children[0].text
  ).toStrictEqual('ccc')
  // 0.3
  expect(children[0].children[1].children[3].checked).toStrictEqual(true)
  expect(
    children[0].children[1].children[3].children[0].children[0].text
  ).toStrictEqual('ddd')
  // 1.0
  expect(children[1].children[1].children[0].checked).toStrictEqual(false)
  expect(
    children[1].children[1].children[0].children[0].children[0].text
  ).toStrictEqual('AAA')
  // 1.1
  expect(children[1].children[1].children[1].checked).toStrictEqual(true)
  expect(
    children[1].children[1].children[1].children[0].children[0].text
  ).toStrictEqual('BBB')
  // 1.2
  expect(children[1].children[1].children[2].checked).toStrictEqual(true)
  expect(
    children[1].children[1].children[2].children[0].children[0].text
  ).toStrictEqual('CCC')
})

test('Extra(backward): links as date', async () => {
  const md: string = `[](@1619823600/day)`
  const value = await markdownToSlate(md)
  expect(value.length).toStrictEqual(1)
  const { children } = value[0]
  expect(children.length).toStrictEqual(1)
  const { type, timestamp } = children[0]
  expect(type).toStrictEqual(kSlateBlockTypeDateTime)
  expect(timestamp).toStrictEqual(1619823600)
})
