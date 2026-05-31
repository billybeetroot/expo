type Lookup = Record<string, string>

const normalizeSpeech = (input: string, lookup: Lookup) => {
  // split into tokens but keep whitespace/punctuation so output stays readable
  const parts = input.split(/(\s+|[.,!?;:()]+)/g)

  return parts
    .map((part) => {
      if (!part) return part
      if (/^\s+$/.test(part)) return part
      if (/^[.,!?;:()]+$/.test(part)) return part

      const key = part.toLowerCase()
      return lookup[key] ?? part
    })
    .join('')
}

export default normalizeSpeech
