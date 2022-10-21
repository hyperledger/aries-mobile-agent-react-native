import { isRedirection, sortCredentialsForAutoSelect } from '../App/utils/helpers'
import path from 'path'
import fs from 'fs'

const proofCredentialPath = path.join(__dirname, './fixtures/proof-credential.json')
const credentials = JSON.parse(fs.readFileSync(proofCredentialPath, 'utf8'))
const shortenerUrls = ['https://shortenerUrlEx.com', 'https://shortenerUrlEx1.com']

describe('Helpers', () => {
  it('URL with c_i is not a redirect', () => {
    const url = 'https://example.com?c_i=blarb'
    const result = isRedirection(url, shortenerUrls)

    expect(result).toBeFalsy()
  })

  it('URL with d_m is not a redirect', () => {
    const url = 'https://example.com?d_m=blarb'
    const result = isRedirection(url, shortenerUrls)

    expect(result).toBeFalsy()
  })

  it('Shortener URL is not a redirect', () => {
    const url = 'https://shortenerUrlEx.com?id=blarb'
    const result = isRedirection(url, shortenerUrls)

    expect(result).toBeFalsy()
  })

  it('Shortener URL with path param is not a redirect', () => {
    const url = 'https://shortenerUrlEx1.com/blarb/invitation'
    const result = isRedirection(url, shortenerUrls)

    expect(result).toBeFalsy()
  })

  it('URL with is redirect', () => {
    const url = 'https://example.com?x_x=blarb'
    const result = isRedirection(url, shortenerUrls)

    expect(result).toBeTruthy()
  })

  test('Sorts credentials for auto select', async () => {
    const sortedCreds = sortCredentialsForAutoSelect(credentials)

    expect(sortedCreds).toMatchSnapshot()
  })
})
