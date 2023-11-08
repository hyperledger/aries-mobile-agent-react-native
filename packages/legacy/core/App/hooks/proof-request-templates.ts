import axios from 'axios'
import { useEffect, useState } from 'react'

import { AnonCredsProofRequestTemplatePayload, ProofRequestTemplate, useProofRequestTemplates } from '../../verifier'
import { useConfiguration } from '../contexts/configuration'
import { useStore } from '../contexts/store'

export interface ProofBundleResolverType {
  resolve: (acceptDevRestrictions: boolean) => Promise<ProofRequestTemplate[] | undefined>
  resolveById: (templateId: string, acceptDevRestrictions: boolean) => Promise<ProofRequestTemplate | undefined>
}

const useRemoteProofBundleResolver = (indexFileBaseUrl: string | undefined): ProofBundleResolverType => {
  if (indexFileBaseUrl) {
    return new RemoteProofBundleResolver(indexFileBaseUrl)
  } else {
    return new DefaultProofBundleResolver()
  }
}

const calculatePreviousYear = (yearOffset: number) => {
  const pastDate = new Date()
  pastDate.setFullYear(pastDate.getFullYear() + yearOffset)
  return parseInt(pastDate.toISOString().split('T')[0].replace(/-/g, ''))
}

const applyTemplateMarkers = (templates: any): any => {
  if (!templates) return templates
  const markerActions: { [key: string]: (param: string) => string } = {
    now: () => Math.floor(new Date().getTime() / 1000).toString(),
    currentDate: (offset: string) => calculatePreviousYear(parseInt(offset)).toString(),
  }
  let templateString = JSON.stringify(templates)
  const markers = [...templateString.matchAll(/"@\{(\w+)(?:\((\S*)\))?\}"/gm)]

  markers.forEach((marker) => {
    const markerValue = markerActions[marker[1] as string](marker[2])
    templateString = templateString.replace(marker[0], markerValue)
  })
  return JSON.parse(templateString)
}

const applyDevRestrictions = (templates: ProofRequestTemplate[]): ProofRequestTemplate[] => {
  return templates.map((temp) => {
    return {
      ...temp,
      payload: {
        ...temp.payload,
        data: (temp.payload as AnonCredsProofRequestTemplatePayload).data.map((data) => {
          return {
            ...data,
            requestedAttributes: data.requestedAttributes?.map((attr) => {
              return {
                ...attr,
                restrictions: [...(attr.restrictions ?? []), ...(attr.devRestrictions ?? [])],
                devRestrictions: [],
              }
            }),
            requestedPredicates: data.requestedPredicates?.map((pred) => {
              return {
                ...pred,
                restrictions: [...(pred.restrictions ?? []), ...(pred.devRestrictions ?? [])],
                devRestrictions: [],
              }
            }),
          }
        }),
      },
    }
  })
}

export class RemoteProofBundleResolver implements ProofBundleResolverType {
  private remoteServer
  private templateData: ProofRequestTemplate[] | undefined

  public constructor(indexFileBaseUrl: string) {
    this.remoteServer = axios.create({
      baseURL: indexFileBaseUrl,
    })
  }
  public async resolve(acceptDevRestrictions: boolean): Promise<ProofRequestTemplate[] | undefined> {
    if (this.templateData) {
      let templateData = this.templateData
      if (acceptDevRestrictions) {
        templateData = applyDevRestrictions(templateData)
      }
      return Promise.resolve(templateData)
    }
    return this.remoteServer.get('proof-templates.json').then((response) => {
      try {
        let templateData: ProofRequestTemplate[] = response.data
        this.templateData = templateData
        if (acceptDevRestrictions) {
          templateData = applyDevRestrictions(templateData)
        }
        return templateData
      } catch (error) {
        return undefined
      }
    })
  }
  public async resolveById(
    templateId: string,
    acceptDevRestrictions: boolean
  ): Promise<ProofRequestTemplate | undefined> {
    if (!this.templateData) {
      return (await this.resolve(acceptDevRestrictions))?.find((template) => template.id === templateId)
    } else {
      let templateData = this.templateData
      if (acceptDevRestrictions) {
        templateData = applyDevRestrictions(templateData)
      }
      const template = templateData.find((template) => template.id === templateId)
      return template
    }
  }
}

export class DefaultProofBundleResolver implements ProofBundleResolverType {
  private proofRequestTemplates
  public constructor() {
    const { proofRequestTemplates } = useConfiguration()
    this.proofRequestTemplates = proofRequestTemplates ?? useProofRequestTemplates
  }
  public async resolve(acceptDevRestrictions: boolean): Promise<ProofRequestTemplate[]> {
    return Promise.resolve(this.proofRequestTemplates(acceptDevRestrictions))
  }
  public async resolveById(
    templateId: string,
    acceptDevRestrictions: boolean
  ): Promise<ProofRequestTemplate | undefined> {
    return Promise.resolve(
      this.proofRequestTemplates(acceptDevRestrictions).find((template) => template.id === templateId)
    )
  }
}

export const useTemplates = (): Array<ProofRequestTemplate> => {
  const [store] = useStore()
  const [proofRequestTemplates, setProofRequestTemplates] = useState<ProofRequestTemplate[]>([])
  const { proofTemplateBaseUrl } = useConfiguration()
  const resolver = useRemoteProofBundleResolver(proofTemplateBaseUrl)
  useEffect(() => {
    resolver.resolve(store.preferences.acceptDevCredentials).then((templates) => {
      if (templates) {
        setProofRequestTemplates(applyTemplateMarkers(templates))
      }
    })
  }, [])
  return proofRequestTemplates
}

export const useTemplate = (templateId: string): ProofRequestTemplate | undefined => {
  const [store] = useStore()
  const [proofRequestTemplate, setProofRequestTemplate] = useState<ProofRequestTemplate | undefined>(undefined)
  const { proofTemplateBaseUrl } = useConfiguration()
  const resolver = useRemoteProofBundleResolver(proofTemplateBaseUrl)
  useEffect(() => {
    resolver.resolveById(templateId, store.preferences.acceptDevCredentials).then((template) => {
      if (template) {
        setProofRequestTemplate(applyTemplateMarkers(template))
      }
    })
  }, [])
  return proofRequestTemplate
}
