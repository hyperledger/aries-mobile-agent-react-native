import { Agent, InboundTransporter } from 'aries-framework'

export async function get(url: string) {
  console.log(`HTTP GET request: '${url}'`)
  const response = await fetch(url)
  console.log(`HTTP GET response status: ${response.status} - ${response.statusText}`)
  return response.text()
}

export async function post(url: string, body: any) {
  console.log(`HTTP POST request: '${url}'`)
  const response = await fetch(url, { method: 'POST', body })
  console.log(`HTTP POST response status: ${response.status} - ${response.statusText}`)
  return response.text()
}

class PollingInboundTransporter implements InboundTransporter {
  public stop: boolean

  public constructor() {
    this.stop = false
  }
  public async start(agent: Agent) {
    await this.registerMediator(agent)
  }

  public async registerMediator(agent: Agent) {
    const mediatorUrl = agent.getMediatorUrl() || ''
    const mediatorInvitationUrl = await get(`${mediatorUrl}/invitation`)
    const { verkey: mediatorVerkey } = JSON.parse(await get(`${mediatorUrl}/`))
    await agent.routing.provision({
      verkey: mediatorVerkey,
      invitationUrl: mediatorInvitationUrl,
    })
    this.pollDownloadMessages(agent)
  }

  private pollDownloadMessages(agent: Agent) {
    setInterval(async () => {
      if (!this.stop) {
        await agent.routing.downloadMessages()
      }
    }, 2000)
  }
}

export { PollingInboundTransporter }
