/**
 * Module to work with settings that a user set up for Foreword
 */

import type { AppSettings } from 'truthsayer-archaeologist-communication'
import { defaultSettings } from 'truthsayer-archaeologist-communication'

import browser from 'webextension-polyfill'

const SETTINGS_KEY = 'app-settings'

export async function getAppSettings(
  browserStore: browser.Storage.StorageArea
): Promise<AppSettings> {
  const records: Record<string, any> = await browserStore.get(SETTINGS_KEY)
  if (SETTINGS_KEY in records) {
    const value: AppSettings = records[SETTINGS_KEY]
    // Enforce offline mode for everyone with a new version of archaeologist
    value.storageType = 'browser_ext'
    return value
  }
  return defaultSettings()
}

export async function setAppSettings(
  browserStore: browser.Storage.StorageArea,
  newValue: AppSettings
): Promise<void> {
  return browserStore.set({ [SETTINGS_KEY]: newValue })
}
