// ==UserScript==
// @name         DuoRain BETA
// @namespace    http://tampermonkey.net/
// @version      1.2
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
                        <span class="duorain-version">v1.2</span>
                    </div>
                    <div id="duorain-status" class="duorain-status-idle">Ready.</div>
                    <div class="duorain-tabs">
                        <button class="duorain-tab-button active" data-tab="xp">XP</button>
                        <button class="duorain-tab-button" data-tab="gems">Gems</button>
                        <button class="duorain-tab-button" data-tab="streak">Streak</button>
                    </div>
                    <div id="duorain-content">
                        <div id="tab-xp" class="duorain-tab-content active">
                            <p class="duorain-label">Story Slug</p>
                            <input type="text" id="story-slug-input" class="duorain-input" value="fr-en-le-passeport">
                            <p class="duorain-desc">Find in a story's URL. Must match your course.</p>
                            <p class="duorain-label">Number of Loops</p>
                            <input type="number" id="xp-loops-input" class="duorain-input" placeholder="e.g., 100" min="1">
                            <button id="start-xp-farm" class="duorain-button-start">Start Farming XP</button>
                        </div>
                        <div id="tab-gems" class="duorain-tab-content">
                            <p class="duorain-label">Number of Gem Loops</p>
                             <input type="number" id="gem-loops-input" class="duorain-input" placeholder="e.g., 10" min="1">
                            <button id="start-gem-farm" class="duorain-button-start">Start Farming Gems</button>
                        </div>
                        <div id="tab-streak" class="duorain-tab-content">
                            <p class="duorain-label">Number of Days to Farm</p>
                            <input type="number" id="streak-days-input" class="duorain-input" placeholder="e.g., 365" min="1">
                            <button id="start-streak-farm" class="duorain-button-start">Start Farming Streak</button>
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
            .duorain-tab-button {
                flex-grow: 1; padding: 10px; border: none; background: #e5e5e5; cursor: pointer; font-weight: bold;
                color: #777; transition: background-color 0.3s, color 0.3s;
            }
            .duorain-tab-button:first-child { border-radius: 8px 0 0 8px; }
            .duorain-tab-button:last-child { border-radius: 0 8px 8px 0; }
            .duorain-tab-button:not(:first-child):not(:last-child) { border-radius: 0; }
            .duorain-tab-button.active { background: #1cb0f6; color: white; }
            .duorain-tab-content { display: none; }
            .duorain-tab-content.active { display: block; text-align: center; }
            .duorain-label { font-size: 14px; color: #4c4c4c; margin-bottom: 5px; text-align: left; font-weight: bold;}
            .duorain-desc { font-size: 12px; color: #afafaf; margin-top: -10px; margin-bottom: 15px; text-align: left; }
            .duorain-input {
                width: 100%; padding: 12px; border-radius: 8px; border: 2px solid #e5e5e5;
                box-sizing: border-box; margin-bottom: 15px; font-size: 16px; text-align: center;
            }
            .duorain-input:focus { border-color: #1cb0f6; outline: none; }
            .duorain-button-start {
                width: 100%; padding: 12px; border-radius: 8px; border: none; background-color: #58a700; color: white;
                font-size: 18px; font-weight: bold; cursor: pointer; border-bottom: 4px solid #4a8d00;
                transition: background-color 0.2s;
            }
            .duorain-button-start:hover { background-color: #69c300; }
            .duorain-button-start:disabled { background-color: #afafaf; border-bottom: 4px solid #777; cursor: not-allowed; }
        `;

        document.body.insertAdjacentHTML('beforeend', uiHTML);
        GM_addStyle(uiStyle);

        document.getElementById('duorain-toggle-button').addEventListener('click', () => {
            document.getElementById('duorain-main-container').classList.toggle('duorain-hidden');
        });

        document.querySelectorAll('.duorain-tab-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.duorain-tab-button, .duorain-tab-content').forEach(el => el.classList.remove('active'));
                button.classList.add('active');
                document.getElementById(`tab-${button.dataset.tab}`).classList.add('active');
            });
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

    function getDuoHeaders(jwt) {
        return {
            "authorization": `Bearer ${jwt}`,
            "cookie": `jwt_token=${jwt}`,
            "connection": "Keep-Alive",
            "content-type": "application/json",
            "user-agent": "Duolingo-Storm/1.0",
            "x-duolingo-device-platform": "web",
            "x-duolingo-app-version": "1.0.0",
            "x-duolingo-application": "chrome",
            "x-duolingo-client-version": "web",
            "accept": "application/json"
        };
    }

    function getUserData(jwt, sub) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: `https://www.duolingo.com/2017-06-30/users/${sub}`,
                headers: getDuoHeaders(jwt),
                onload: function(response) {
                    if (response.status >= 200 && response.status < 300) {
                        const data = JSON.parse(response.responseText);
                        resolve({
                            fromLanguage: data.fromLanguage || 'en',
                            learningLanguage: data.learningLanguage || 'es',
                            streakStartDate: data.streakData?.currentStreak?.startDate
                        });
                    } else {
                        updateStatus(`Error fetching profile: ${response.status}`, "error");
                        reject(new Error(`HTTP error! status: ${response.status}`));
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

        let totalXp = 0;
        for (let i = 0; i < count; i++) {
            const now_ts = Math.floor(Date.now() / 1000);
            const payload = {
                "awardXp": true, "completedBonusChallenge": true, "fromLanguage": fromLang, "learningLanguage": toLang,
                "hasXpBoost": false, "illustrationFormat": "svg", "isFeaturedStoryInPracticeHub": true, "isLegendaryMode": true,
                "isV2Redo": false, "isV2Story": false, "masterVersion": true, "maxScore": 0, "score": 0,
                "happyHourBonusXp": 469, "startTime": now_ts, "endTime": now_ts
            };

            await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "POST",
                    url: `https://stories.duolingo.com/api2/stories/${slug}/complete`,
                    headers: getDuoHeaders(jwt),
                    data: JSON.stringify(payload),
                    onload: function(response) {
                        if (response.status === 200) {
                            const data = JSON.parse(response.responseText);
                            const awardedXp = data.awardedXp || 0;
                            totalXp += awardedXp;
                            updateStatus(`Loop ${i + 1}/${count} | +${awardedXp} XP | Total: ${totalXp}`, "working");
                            resolve();
                        } else {
                            updateStatus(`Error loop ${i + 1}: ${response.status} - See console`, "error");
                            console.error('XP Farm Error Response:', response.responseText);
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
            }).catch(() => { i = count; });

            if (!isFarming) break;
            await new Promise(resolve => setTimeout(resolve, 600));
        }
        if (isFarming) {
            updateStatus(`Farming complete! Total XP: ${totalXp}`, "success");
            toggleFarming(false);
        }
    }

    async function farmGems(jwt, uid, fromLang, toLang, count) {
        if (isFarming) return;
        toggleFarming(true);
        updateStatus("Farming Gems...", "working");

        const gemRewards = ["SKILL_COMPLETION_BALANCED-...-2-GEMS", "SKILL_COMPLETION_BALANCED-...-2-GEMS"];
        let totalGems = 0;

        for (let i = 0; i < count; i++) {
            for (const reward of gemRewards) {
                 await new Promise(resolve => {
                    GM_xmlhttpRequest({
                        method: 'PATCH',
                        url: `https://www.duolingo.com/2017-06-30/users/${uid}/rewards/${reward}`,
                        headers: getDuoHeaders(jwt),
                        data: JSON.stringify({ "consumed": true, "fromLanguage": fromLang, "learningLanguage": toLang }),
                        onload: response => { if(response.status !== 200) console.warn(`Failed to redeem ${reward}`); resolve(); },
                        onerror: () => { console.error(`Error redeeming ${reward}`); resolve(); }
                    });
                });
            }
            totalGems += 120;
            updateStatus(`Loop ${i + 1}/${count} | Total Gems: ~${totalGems}`, "working");
            if (!isFarming) break;
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (isFarming) {
            updateStatus(`Gem farming complete! Total Gems: ~${totalGems}`, "success");
            toggleFarming(false);
        }
    }

    async function farmStreak(jwt, uid, fromLang, toLang, days) {
        if (isFarming) return;
        toggleFarming(true);

        const userData = await getUserData(jwt, uid).catch(() => null);
        if (!userData) { toggleFarming(false); return; }

        const startDate = userData.streakStartDate ? new Date(userData.streakStartDate) : new Date();
        updateStatus(`Starting streak farm from ${startDate.toISOString().split('T')[0]}`, "working");

        const SESSIONS_URL = "https://www.duolingo.com/2017-06-30/sessions";
        const CHALLENGE_TYPES = ["assist", "characterIntro", "characterMatch", "characterPuzzle", "characterSelect", "characterTrace", "characterWrite", "completeReverseTranslation", "definition", "dialogue", "extendedMatch", "extendedListenMatch", "form", "freeResponse", "gapFill", "judge", "listen", "listenComplete", "listenMatch", "match", "name", "listenComprehension", "listenIsolation", "listenSpeak", "listenTap", "orderTapComplete", "partialListen", "partialReverseTranslate", "patternTapComplete", "radioBinary", "radioImageSelect", "radioListenMatch", "radioListenRecognize", "radioSelect", "readComprehension", "reverseAssist", "sameDifferent", "select", "selectPronunciation", "selectTranscription", "svgPuzzle", "syllableTap", "syllableListenTap", "speak", "tapCloze", "tapClozeTable", "tapComplete", "tapCompleteTable", "tapDescribe", "translate", "transliterate", "transliterationAssist", "typeCloze", "typeClozeTable", "typeComplete", "typeCompleteTable", "writeComprehension"];

        for (let i = 0; i < days; i++) {
            const simDay = new Date(startDate);
            simDay.setDate(simDay.getDate() - i);
            updateStatus(`Farming for ${simDay.toISOString().split('T')[0]} (${i + 1}/${days})`, "working");

            const postPayload = {
                "challengeTypes": CHALLENGE_TYPES, "fromLanguage": fromLang, "learningLanguage": toLang,
                "isFinalLevel": false, "isV2": true, "juicy": true, "smartTipsVersion": 2, "type": "GLOBAL_PRACTICE"
            };

            await new Promise(resolve => {
                GM_xmlhttpRequest({
                    method: 'POST', url: SESSIONS_URL, headers: getDuoHeaders(jwt), data: JSON.stringify(postPayload),
                    onload: (r1) => {
                        if (r1.status !== 200) { console.error(`POST fail for ${simDay.toISOString().split('T')[0]}`); resolve(); return; }
                        const sessionData = JSON.parse(r1.responseText);
                        const sessionId = sessionData.id;
                        if (!sessionId) { resolve(); return; }

                        const startTs = Math.floor((simDay.getTime() / 1000) - 60);
                        const endTs = Math.floor(simDay.getTime() / 1000);
                        const putPayload = { ...sessionData, "heartsLeft": 5, "startTime": startTs, "endTime": endTs, "enableBonusPoints": false, "failed": false, "maxInLessonStreak": 9, "shouldLearnThings": true };

                        GM_xmlhttpRequest({
                             method: 'PUT', url: `${SESSIONS_URL}/${sessionId}`, headers: getDuoHeaders(jwt), data: JSON.stringify(putPayload),
                             onload: (r2) => { if (r2.status !== 200) console.error(`PUT fail for ${simDay.toISOString().split('T')[0]}`); resolve(); },
                             onerror: () => { console.error(`PUT request fail`); resolve(); }
                        });
                    },
                    onerror: () => { console.error(`POST request fail`); resolve(); }
                });
            });
            if (!isFarming) break;
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        if (isFarming) {
            updateStatus("🎉 Streak farming complete!", "success");
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

            document.getElementById('start-gem-farm').addEventListener('click', () => {
                const count = parseInt(document.getElementById('gem-loops-input').value, 10);
                if (count > 0) {
                    farmGems(jwt, userId, fromLanguage, learningLanguage, count);
                } else {
                     updateStatus("Please enter a valid loop count.", "error");
                }
            });

            document.getElementById('start-streak-farm').addEventListener('click', () => {
                 const count = parseInt(document.getElementById('streak-days-input').value, 10);
                if (count > 0) {
                    farmStreak(jwt, userId, fromLanguage, learningLanguage, count);
                } else {
                    updateStatus("Please enter a valid number of days.", "error");
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
