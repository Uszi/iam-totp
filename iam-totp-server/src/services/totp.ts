import geoip from 'geoip-lite'
import heversine from 'haversine-distance'

import config from '../config'

export const isTOTPRequired = ( user, fingerprint_hash, ip_addr ) => {
    const { MFA_GLOBAL } = config
    /* per user settings overriding global settings */
    if(user.forced_mfa_setting === 'off') return false
    if(user.forced_mfa_setting === 'on') return true

    if(MFA_GLOBAL === 'off') return false
    if(MFA_GLOBAL === 'on') return true

    const TIME_TO_EXPIRE_DATE = user.ttf_device_setting > 0 ? user.ttf_device_setting : config.TIME_TO_EXPIRE_DATE
    const IMPOSSIBLE_TRAVEL_DISTANCE = user.impossible_travel_distance_setting > 0 ? user.impossible_travel_distance_setting : config.IMPOSSIBLE_TRAVEL_DISTANCE

    const { devices_fingerprints } = user

    const devices_valid = []
    const date_valid = new Date().getTime() - ( TIME_TO_EXPIRE_DATE * 1000 )
    const last_device = devices_fingerprints.length > 0 ? devices_fingerprints[0] : null

    for(let i = 0; i < devices_fingerprints.length; ++i) {
        const device = devices_fingerprints[i]
        if(device.timestamp_utc > date_valid) devices_valid.push(device)
        else break
    }

    const last_30days = devices_valid.some(d => d.fingerprint_hash == fingerprint_hash)

    if(last_30days && last_device) {
        const currentIPLoopup = geoip.lookup(ip_addr)

        if( currentIPLoopup ) {
            const lastDeviceIPLookup = geoip.lookup(last_device.ip_addr)
            const point1 = { lat: currentIPLoopup.ll[0], lon: currentIPLoopup.ll[1] }
            const point2 = { lat: lastDeviceIPLookup.ll[0], lon: lastDeviceIPLookup.ll[1] }
            const distance_km = heversine(point1, point2) / 1000 // in km

            return distance_km > IMPOSSIBLE_TRAVEL_DISTANCE
        } else {
            /* Do not force MFA if IP lookup failed */
            return ip_addr !== last_device.ip_addr
        }
    }

    return true
}