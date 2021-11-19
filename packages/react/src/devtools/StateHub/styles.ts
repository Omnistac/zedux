type Colors = string[] & {
  alphas: { main: string[]; secondary: string[]; white: string[] }
  bgs: string[]
  main: string
  secondary: string
  white: string
}

export const alphas = ['0.04', '0.07', '0.15', '0.25', '0.4']

export const colors = [
  '#ffd6b9',
  '#ffb9d6',
  '#d6ffb9',
  '#d6b9ff',
  '#b9ffd6',
  '#b9d6ff',
] as Colors

export const hexToAlpha = (str: string, alpha: number | string) => {
  const rgb = str
    .slice(1)
    .replace(/\w{2}/g, match => `${parseInt(match, 16)}, `)

  return `rgba(${rgb}${alpha})`
}

export const logIcon =
  'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSIwIDAgNTAwIDUwMCIgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6Yng9Imh0dHBzOi8vYm94eS1zdmcuY29tIj4KICA8Y2lyY2xlIHN0eWxlPSJwYWludC1vcmRlcjogZmlsbDsgZmlsbC1ydWxlOiBub256ZXJvOyBzdHJva2Utd2lkdGg6IDY3cHg7IGZpbGw6IHJnYmEoNzksIDg1LCAxMDUsIDApOyBzdHJva2U6IHJnYig2OCwgNzMsIDkzKTsiIGN4PSIxODQuNzY3IiBjeT0iMTU5Ljc4MiIgcj0iMTE2LjQ0NSIvPgogIDxwYXRoIHN0eWxlPSJmaWxsOiByZ2IoNjgsIDczLCA5Myk7IiBkPSJNIDE3NC4wMjcgNzIuNjc3IEggMjUyLjE4OCBWIDI1OS4xNjIgQSAxMiAxMiAwIDAgMSAyNDAuMTg4IDI3MS4xNjIgSCAxODYuMDI3IEEgMTIgMTIgMCAwIDEgMTc0LjAyNyAyNTkuMTYyIFYgNzIuNjc3IFoiIHRyYW5zZm9ybT0ibWF0cml4KDAuODkxMDA2LCAwLjQ1Mzk5MSwgLTAuNDUzOTkxLCAwLjg5MTAwNiwgLTM1Ljg0NTYyMywgMTE5LjQxMzM0NSkiIGJ4OnNoYXBlPSJyZWN0IDE3NC4wMjcgNzIuNjc3IDc4LjE2MSAxOTguNDg1IDAgMCAxMiAxMiAxQDY3ZmI1ODZlIi8+CiAgPHJlY3QgeD0iMzQxLjYwNyIgeT0iMTg5LjQ2NiIgd2lkdGg9Ijc4LjUzOSIgaGVpZ2h0PSI5Ny42MzUiIHN0eWxlPSJmaWxsOiByZ2IoNjgsIDczLCA5Myk7Ii8+CiAgPHBhdGggZD0iTSA3OTEuMDc4IDIyLjE5NyBMIDkzMS41ODggMTE2LjIyIEwgNjUwLjU2NyAxMTYuMjIgTCA3OTEuMDc4IDIyLjE5NyBaIiBzdHlsZT0iZmlsbDogcmdiKDY4LCA3MywgOTMpOyIgdHJhbnNmb3JtPSJtYXRyaXgoLTAuMDAwMDU0LCAxLCAtMSwgLTAuMDAwMDU0LCA1MjIuMjYxOTYzLCAtNTUzLjI5Njc1MykiIGJ4OnNoYXBlPSJ0cmlhbmdsZSA2NTAuNTY3IDIyLjE5NyAyODEuMDIxIDk0LjAyMyAwLjUgMCAxQGU3OGFhYmU4Ii8+Cjwvc3ZnPg=='

export const svgBlue = '#44495d'

let seed = Math.floor(Math.random() * colors.length)
export const randomColor = () => colors[seed++ % colors.length]

colors.main = randomColor()
colors.secondary = randomColor()
colors.white = '#f7f7f7'

colors.alphas = {
  main: alphas.map(alpha => hexToAlpha(colors.main, alpha)),
  secondary: alphas.map(alpha => hexToAlpha(colors.secondary, alpha)),
  white: alphas.map(alpha => hexToAlpha(colors.white, alpha)),
}

colors.bgs = ['#0c1f30', '#0a142e']
