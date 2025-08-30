// ==UserScript==
// @name         DuoRain BETA
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automates Duolingo XP, Gems, and Streak farming.
// @author       OracleMythix
// @match        https://*.duolingo.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      duolingo.com
// @connect      stories.duolingo.com
// ==/UserScript==

(function() {
    'use strict';

    function getJwtToken() {
        try {
            const jwtMatch = document.cookie.match(/(?:^|;\s*)jwt_token=([^;]*)/);
            return jwtMatch ? jwtMatch[1] : null;
        } catch (e) {
            console.error("DuoRain Error: Failed to get JWT token.", e);
            return null;
        }
    }

    function parseJwt(token) {
        if (!token) return null;
        try {
            const payload = token.split('.')[1];
            const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
            return JSON.parse(decodedPayload);
        } catch (e) {
            console.error("DuoRain Error: Failed to parse JWT.", e);
            return null;
        }
    }

    function injectUI() {
        const uiHTML = `
            <div id="duorain-main-container" class="duorain-hidden">
                <div class="duorain-main-box">
                    <div class="duorain-header">
                        <span class="duorain-title">DuoRain</span>
                        <span class="duorain-version">v1.1</span>
                    </div>
                    <div id="duorain-status" class="duorain-status-idle">Ready.</div>
                    <div class="duorain-tabs">
                        <button class="duorain-tab-button active" data-tab="xp">XP Farm</button>
                    </div>
                    <div id="duorain-content">
                        <div id="tab-xp" class="duorain-tab-content active">
                            <p class="duorain-label">Story Slug (Course Specific)</p>
                            <input type="text" id="story-slug-input" class="duorain-input" value="fr-en-le-passeport">
                            <p class="duorain-label">Number of Loops</p>
                            <input type="number" id="xp-loops-input" class="duorain-input" placeholder="e.g., 100" min="1">
                            <button id="start-xp-farm" class="duorain-button-start">Start Farming XP</button>
                        </div>
                    </div>
                </div>
            </div>
            <div id="duorain-toggle-button">
                <span>Storm 🌪️</span>
            </div>
        `;

        const uiStyle = `
            #duorain-toggle-button {
                position: fixed; bottom: 20px; right: 20px; background-color: #1cb0f6; color: white;
                padding: 10px 15px; border-radius: 20px; cursor: pointer; font-family: "Duolingo Rounded", "Arial", sans-serif;
                font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 10000;
            }
            #duorain-main-container {
                position: fixed; bottom: 80px; right: 20px; width: 320px; font-family: "Duolingo Rounded", "Arial", sans-serif;
                z-index: 9999; transition: opacity 0.3s, transform 0.3s;
            }
            #duorain-main-container.duorain-hidden { opacity: 0; transform: translateY(20px); pointer-events: none; }
            .duorain-main-box { background: white; border-radius: 16px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); padding: 20px; border: 1px solid #e5e5e5; }
            .duorain-header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #e5e5e5; padding-bottom: 10px; margin-bottom: 15px; }
            .duorain-title { font-size: 24px; font-weight: bold; color: #4c4c4c; }
            .duorain-version { font-size: 12px; color: #afafaf; }
            #duorain-status { padding: 10px; margin-bottom: 15px; border-radius: 8px; font-weight: bold; text-align: center; transition: background-color 0.3s, color 0.3s; }
            .duorain-status-idle { background-color: #e5e5e5; color: #777; }
            .duorain-status-working { background-color: #ffc800; color: #4c4c4c; }
            .duorain-status-success { background-color: #58a700; color: white; }
            .duorain-status-error { background-color: #ff4b4b; color: white; }
            .duorain-tabs { display: flex; margin-bottom: 15px; }
            .duorain-tab-button { flex-grow: 1; padding: 10px; border: none; background: #e5e5e5; cursor: pointer; font-weight: bold; color: #777; transition: background-color 0.3s, color 0.3s; border-radius: 8px; }
            .duorain-tab-button.active { background: #1cb0f6; color: white; }
            .duorain-tab-content { display: none; }
            .duorain-tab-content.active { display: block; text-align: center; }
            .duorain-label { font-size: 14px; color: #777; margin-bottom: 5px; text-align: left; }
            .duorain-input { width: 100%; padding: 12px; border-radius: 8px; border: 2px solid #e5e5e5; box-sizing: border-box; margin-bottom: 15px; font-size: 16px; text-align: center; }
            .duorain-input:focus { border-color: #1cb0f6; outline: none; }
            .duorain-button-start {
                width: 100%; padding: 12px; border-radius: 8px; border: none; background-color: #58a700; color: white;
                font-size: 18px; font-weight: bold; cursor: pointer; border-bottom: 4px solid #4a8d00; transition: background-color 0.2s;
            }
            .duorain-button-start:hover { background-color: #69c300; }
            .duorain-button-start:disabled { background-color: #afafaf; border-bottom: 4px solid #777; cursor: not-allowed; }
        `;

        document.body.insertAdjacentHTML('beforeend', uiHTML);
        GM_addStyle(uiStyle);

        document.getElementById('duorain-toggle-button').addEventListener('click', () => {
            document.getElementById('duorain-main-container').classList.toggle('duorain-hidden');
        });
    }

    let isFarming = false;
    const statusEl = () => document.getElementById('duorain-status');
    const startButtons = () => document.querySelectorAll('.duorain-button-start');

    function updateStatus(message, type) {
        if (statusEl()) {
            statusEl().textContent = message;
            statusEl().className = `duorain-status-${type}`;
        }
    }

    function toggleFarming(state) {
        isFarming = state;
        startButtons().forEach(btn => btn.disabled = state);
    }

    function getUserData(jwt, sub) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: `https://www.duolingo.com/2017-06-30/users/${sub}`,
                headers: {
                    "Authorization": `Bearer ${jwt}`,
                    "User-Agent": "Duolingo-Storm/1.0",
                },
                onload: function(response) {
                    if (response.status >= 200 && response.status < 300) {
                        const data = JSON.parse(response.responseText);
                        resolve({
                            fromLanguage: data.fromLanguage || 'en',
                            learningLanguage: data.learningLanguage || 'es',
                        });
                    } else {
                        updateStatus(`Error fetching profile: ${response.status}`, "error");
                        reject(null);
                    }
                },
                onerror: function(error) {
                    updateStatus("Failed to fetch user data.", "error");
                    reject(error);
                }
            });
        });
    }

    async function farmXp(jwt, fromLang, toLang, count, slug) {
        if (isFarming) return;
        toggleFarming(true);
        updateStatus("Farming XP...", "working");

        const headers = {
            "Authorization": `Bearer ${jwt}`,
            "Content-Type": "application/json",
            "User-Agent": "Duolingo-Storm/1.0",
            "x-duolingo-client-version": "web",
        };

        let totalXp = 0;

        for (let i = 0; i < count; i++) {
            const now_ts = Math.floor(Date.now() / 1000);
            const payload = {
                "awardXp": true,
                "completedBonusChallenge": true,
                "fromLanguage": fromLang,
                "learningLanguage": toLang,
                "hasXpBoost": false,
                "illustrationFormat": "svg",
                "isFeaturedStoryInPracticeHub": true,
                "isLegendaryMode": true,
                "isV2Redo": false,
                "isV2Story": false,
                "masterVersion": true,
                "maxScore": 0,
                "score": 0,
                "happyHourBonusXp": 469,
                "startTime": now_ts,
                "endTime": now_ts
            };

            await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "POST",
                    url: `https://stories.duolingo.com/api2/stories/${slug}/complete`,
                    headers: headers,
                    data: JSON.stringify(payload),
                    onload: function(response) {
                        if (response.status === 200) {
                            const data = JSON.parse(response.responseText);
                            const awardedXp = data.awardedXp || 0;
                            totalXp += awardedXp;
                            updateStatus(`Loop ${i + 1}/${count} | +${awardedXp} XP | Total: ${totalXp}`, "working");
                            resolve();
                        } else {
                            updateStatus(`Error on loop ${i + 1}: ${response.status} ${response.statusText}`, "error");
                            toggleFarming(false);
                            reject(new Error(response.statusText));
                        }
                    },
                    onerror: function(error) {
                        updateStatus(`Request failed on loop ${i + 1}`, "error");
                        toggleFarming(false);
                        reject(error);
                    }
                });
            }).catch(() => {
                i = count;
            });

            if (isFarming === false) break;
            await new Promise(resolve => setTimeout(resolve, 600));
        }

        if (isFarming) {
            updateStatus(`Farming complete! Total XP: ${totalXp}`, "success");
            toggleFarming(false);
        }
    }

    async function main() {
        injectUI();

        const jwt = getJwtToken();
        if (!jwt) {
            updateStatus("JWT not found. Please log in.", "error");
            return;
        }

        const decodedJwt = parseJwt(jwt);
        if (!decodedJwt || !decodedJwt.sub) {
            updateStatus("Could not decode JWT.", "error");
            return;
        }
        const userId = decodedJwt.sub;

        try {
            const userData = await getUserData(jwt, userId);
            const { fromLanguage, learningLanguage } = userData;

            document.getElementById('start-xp-farm').addEventListener('click', () => {
                const count = parseInt(document.getElementById('xp-loops-input').value, 10);
                const slug = document.getElementById('story-slug-input').value.trim();
                if (count > 0 && slug) {
                    farmXp(jwt, fromLanguage, learningLanguage, count, slug);
                } else {
                    updateStatus("Please enter a valid slug and loop count.", "error");
                }
            });

        } catch (error) {
            console.error("DuoRain Init Error:", error);
            updateStatus("Initialization failed. See console.", "error");
        }
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }

})();
