export async function encryptNotes(
  notes: {id: string; txt: string}[],
  strKey: string
): Promise<{id: string; cipher_text: string; iv: string}[]> {
  const key = await importKey(strKey)
  const encryptedNotes = await Promise.all(
    notes.map(({id, txt}) =>
      encryptData(key, txt).then(({cipher_text, iv}) => ({id, cipher_text, iv}))
    )
  )
  return encryptedNotes
}

export async function decryptNotes(
  notes: {id: string; cipher_text: string; iv: string}[],
  strKey: string
): Promise<{id: string; txt: string}[]> {
  const key = await importKey(strKey)
  const decryptedNotes = await Promise.all(
    notes.map(({id, cipher_text, iv}) =>
      decryptData(key, cipher_text, iv).then((txt) => ({id, txt}))
    )
  )
  return decryptedNotes
}

function ivToBase64(iv: Uint8Array): string {
  return btoa(String.fromCharCode(...iv))
}

function base64ToIv(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
}

export async function generateKey(): Promise<string> {
  // Generate an AES-GCM symmetric key
  const key = await crypto.subtle.generateKey(
    {name: 'AES-GCM', length: 256}, // Algorithm and key size
    true, // The key can be exported
    ['encrypt', 'decrypt'] // Usages
  )
  return await exportKey(key)
}

async function exportKey(key: CryptoKey): Promise<string> {
  // Export the key as a raw byte buffer
  const exportedKey = await crypto.subtle.exportKey('raw', key)
  // Convert the byte buffer to a Base64 string for storage/transmission
  return btoa(String.fromCharCode(...new Uint8Array(exportedKey)))
}

async function importKey(base64Key: string): Promise<CryptoKey> {
  // Convert the Base64 string back to a Uint8Array
  const binaryKey = Uint8Array.from(atob(base64Key), (char) => char.charCodeAt(0))
  // Import the raw key back into a CryptoKey object
  const key = await crypto.subtle.importKey(
    'raw',
    binaryKey,
    {name: 'AES-GCM'}, // Algorithm
    true, // Whether the key can be exported again
    ['encrypt', 'decrypt'] // Usages
  )
  return key
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)).buffer
}

async function encryptData(
  key: CryptoKey,
  data: string
): Promise<{cipher_text: string; iv: string}> {
  const encoder = new TextEncoder()
  const encodedData = encoder.encode(data)

  const iv = crypto.getRandomValues(new Uint8Array(12)) // 12 bytes for AES-GCM
  const cipher_text = await crypto.subtle.encrypt({name: 'AES-GCM', iv}, key, encodedData)
  return {cipher_text: arrayBufferToBase64(cipher_text), iv: ivToBase64(iv)}
}

async function decryptData(key: CryptoKey, cipher_text: string, ivBase64: string): Promise<string> {
  const decryptedData = await crypto.subtle.decrypt(
    {name: 'AES-GCM', iv: base64ToIv(ivBase64)},
    key,
    base64ToArrayBuffer(cipher_text)
  )
  const decoder = new TextDecoder()
  return decoder.decode(decryptedData)
}
