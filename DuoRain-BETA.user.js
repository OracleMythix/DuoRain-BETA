// ==UserScript==
// @name         DuoRain BETA
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Duolingo XP, Gems, and Streak farming Tool.
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
                <div class="DLP_Main_Box">
                    <div class="DLP_VStack_8">
                       <div class="DLP_HStack_Auto_Top DLP_NoSelect">
                            <div class="DLP_HStack_4">
                                <p class="DLP_Text_Style_2">Duo<span class="duorain-neon-blue">Rain</span></p>
                            </div>
                            <p class="DLP_Text_Style_1" style="margin-top: 2px; font-size: 14px; color: #FF9500;">BETA</p>
                        </div>
                        <div id="duorain-status-area">
                            <div id="duorain-status-indicator" class="DLP_Button_Style_1 DLP_Magnetic_Hover_1 DLP_NoSelect idle">
                                <p id="duorain-status-indicator-text" class="DLP_Text_Style_1">Status: Idle</p>
                            </div>
                        </div>
                        <div class="DLP_VStack_8" id="DLP_Main_Inputs_1_Divider_1_ID">
                            <div class="DLP_VStack_8" id="duorain-xp-farm-box">
                                <p class="DLP_Text_Style_1 DLP_NoSelect" style="align-self: stretch; opacity: 0.8;">How many XP loops would you like to run?</p>
                                <div class="DLP_HStack_8">
                                    <div class="DLP_Input_Style_1_Active">
                                        <input type="number" min="1" placeholder="0" id="duorain-xp-loops-input" class="DLP_Input_Input_Style_1">
                                    </div>
                                    <div class="DLP_Input_Button_Style_1_Active DLP_Magnetic_Hover_1 DLP_NoSelect" id="duorain-start-xp-farm">
                                        <p class="DLP_Text_Style_1" style="color: #FFF;">RUN</p>
                                    </div>
                                </div>
                            </div>
                             <div class="DLP_VStack_8" id="duorain-gem-farm-box">
                                <p class="DLP_Text_Style_1 DLP_NoSelect" style="align-self: stretch; opacity: 0.8;">How many Gem Loops would you like to run?</p>
                                <div class="DLP_HStack_8">
                                    <div class="DLP_Input_Style_1_Active">
                                        <input type="number" min="1" placeholder="0" id="duorain-gem-loops-input" class="DLP_Input_Input_Style_1">
                                    </div>
                                    <div class="DLP_Input_Button_Style_1_Active DLP_Magnetic_Hover_1 DLP_NoSelect" id="duorain-start-gem-farm">
                                        <p class="DLP_Text_Style_1" style="color: #FFF;">RUN</p>
                                    </div>
                                </div>
                            </div>
                             <div class="DLP_VStack_8" id="duorain-streak-farm-box">
                                <p class="DLP_Text_Style_1 DLP_NoSelect" style="align-self: stretch; opacity: 0.8;">How many days of Streak to repair?</p>
                                <div class="DLP_HStack_8">
                                    <div class="DLP_Input_Style_1_Active">
                                        <input type="number" min="1" placeholder="0" id="duorain-streak-days-input" class="DLP_Input_Input_Style_1">
                                    </div>
                                    <div class="DLP_Input_Button_Style_1_Active DLP_Magnetic_Hover_1 DLP_NoSelect" id="duorain-start-streak-farm">
                                        <p class="DLP_Text_Style_1" style="color: #FFF;">GET</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="duorain-tasks-container" class="duorain-hidden">
                 <div class="DLP_Main_Box">
                    <div class="DLP_VStack_8">
                       <div class="DLP_HStack_Auto_Top DLP_NoSelect">
                            <p class="DLP_Text_Style_2">Running Tasks</p>
                            <div id="duorain-close-tasks-button" class="DLP_Magnetic_Hover_1" style="cursor: pointer; padding: 4px;">
                                 <p class="DLP_Text_Style_1" style="font-size: 14px; opacity: 0.8;">BACK</p>
                            </div>
                        </div>
                        <div id="duorain-running-tasks-list-content" class="DLP_VStack_8" style="margin-top: 8px;">
                        </div>
                    </div>
                </div>
            </div>
             <div id="duorain-toggle-button" class="DLP_Magnetic_Hover_1 DLP_NoSelect">
                <span>Storm 🌪️</span>
            </div>
        `;

        const uiStyle = `
            :root {
                --duorain-bg-color: rgb(var(--color-snow), 0.8);
                --duorain-text-color: rgb(var(--color-black-text));
                --duorain-border-color: rgb(var(--color-eel), 0.10);
                --duorain-input-bg: rgba(0, 122, 255, 0.10);
                --duorain-input-outline: rgba(0, 122, 255, 0.20);
                --duorain-input-text: #007AFF;
                --duorain-input-placeholder: rgba(0, 122, 255, 0.5);
                --duorain-status-box-bg: rgba(0, 0, 0, 0.05);
                --duorain-idle-bg: rgb(var(--color-eel), 0.10);
                --duorain-idle-text: rgb(var(--color-eel));
                --duorain-running-bg: rgba(255, 149, 0, 0.2);
                --duorain-running-text: #f57c00;
            }

            html._2L9MF {
                --duorain-bg-color: rgb(var(--color-gray-9), 0.8);
                --duorain-text-color: rgb(var(--color-snow));
                --duorain-border-color: rgb(var(--color-gray-2), 0.10);
                --duorain-input-bg: rgba(0, 0, 0, 0.2);
                --duorain-input-outline: rgba(0, 122, 255, 0.20);
                --duorain-input-text: #89CFF0;
                --duorain-input-placeholder: rgba(137, 207, 240, 0.5);
                --duorain-status-box-bg: rgba(0,0,0,0.2);
                --duorain-idle-bg: rgba(120, 120, 128, 0.2);
                --duorain-idle-text: rgba(255,255,255,0.6);
                --duorain-running-bg: rgba(255, 149, 0, 0.3);
                --duorain-running-text: #FFD580;
            }

            @font-face { font-family: 'DuoRain'; src: url(https://raw.githubusercontent.com/SlimyThor/DuoRain.Site/main/DuoRain.woff2) format('woff2'); font-weight: 600; }
            .DLP_NoSelect { -webkit-user-select: none; -ms-user-select: none; user-select: none; }
            .DLP_Text_Style_1 { font-family: "DuoRain", sans-serif; font-size: 16px; font-weight: 500; margin: 0; transition: color 0.4s ease; }
            .DLP_Text_Style_2 { font-family: "DuoRain", sans-serif; font-size: 24px; font-weight: 500; margin: 0; transition: color 0.4s ease; }
            .duorain-neon-blue { color: #03A9F4; text-shadow: 0 0 2px #03A9F4, 0 0 6px #2196F3; }
            .DLP_Magnetic_Hover_1 { transition: filter 0.4s, transform 0.4s; cursor: pointer; }
            .DLP_Magnetic_Hover_1:hover { filter: brightness(0.9); transform: scale(1.05); }
            .DLP_Magnetic_Hover_1:active { filter: brightness(0.9); transform: scale(0.9); }
            #duorain-main-container, #duorain-tasks-container { display: flex; flex-direction: column; gap: 8px; position: fixed; right: 16px; bottom: 80px; z-index: 9999; transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            #duorain-main-container.duorain-hidden, #duorain-tasks-container.duorain-hidden { opacity: 0; transform: scale(0.95) translateY(20px); pointer-events: none; }
            .DLP_Main_Box { display: flex; width: 340px; padding: 24px 20px; box-sizing: border-box; flex-direction: column; gap: 8px; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.25); transition: background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease; background: var(--duorain-bg-color); backdrop-filter: blur(16px) saturate(180%); -webkit-backdrop-filter: blur(16px) saturate(180%); border: 1px solid var(--duorain-border-color); }
            .DLP_HStack_Auto_Top, .DLP_HStack_4, .DLP_HStack_8 { display: flex; align-items: center; align-self: stretch; }
            .DLP_HStack_Auto_Top { justify-content: space-between; align-items: flex-start; }
            .DLP_HStack_4 { gap: 4px; }
            .DLP_HStack_8 { gap: 8px; }
            .DLP_VStack_8 { display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 8px; align-self: stretch; }
            .DLP_Button_Style_1 { display: flex; height: 40px; padding: 10px 12px; box-sizing: border-box; align-items: center; gap: 6px; flex: 1 0 0; border-radius: 12px; }
            .DLP_Input_Style_1_Active { display: flex; height: 48px; padding: 16px; box-sizing: border-box; align-items: center; flex: 1 0 0; gap: 6px; border-radius: 8px; transition: background 0.4s ease, outline 0.4s ease; background: var(--duorain-input-bg); outline: 2px solid var(--duorain-input-outline); }
            .DLP_Input_Button_Style_1_Active { display: flex; height: 48px; padding: 12px; box-sizing: border-box; justify-content: center; align-items: center; gap: 6px; border-radius: 8px; background: #007AFF; }
            .DLP_Input_Input_Style_1 { border: none; outline: none; background: none; text-align: left; font-family: "DuoRain", sans-serif; font-size: 16px; font-weight: 500; width: 100%; transition: color 0.4s ease; color: var(--duorain-input-text); }
            .DLP_Input_Input_Style_1::placeholder { transition: color 0.4s ease; color: var(--duorain-input-placeholder); }
            .DLP_Input_Input_Style_1::-webkit-outer-spin-button, .DLP_Input_Input_Style_1::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
            #duorain-status-area { margin-bottom: 8px; }
            #duorain-status-indicator { justify-content: center; transition: all 0.3s ease; }
            #duorain-running-tasks-list-content { width: 100%; }
            .duorain-farm-status-box { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-radius: 12px; transition: background-color 0.4s ease; background-color: var(--duorain-status-box-bg); width: 100%; box-sizing: border-box; }
            .duorain-farm-status-box .status-text { font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .duorain-farm-status-box .duorain-button-stop { padding: 4px 10px; border-radius: 8px; border: none; background-color: #FF3B30; color: white; font-size: 12px; font-weight: bold; cursor: pointer; transition: background-color 0.2s; }
            #duorain-toggle-button { position: fixed; bottom: 20px; right: 20px; background-image: linear-gradient(45deg, #007AFF, #5AC8FA); color: white; padding: 12px 18px; border-radius: 50px; cursor: pointer; font-family: "DuoRain", sans-serif; font-weight: bold; box-shadow: 0 5px 20px rgba(0, 122, 255, 0.35); z-index: 10000; }

            .DLP_Text_Style_1, .DLP_Text_Style_2 { color: var(--duorain-text-color); }
            .duorain-farm-status-box .status-text { color: var(--duorain-text-color); }
            #duorain-status-indicator.idle { background-color: var(--duorain-idle-bg); }
            #duorain-status-indicator.idle p { color: var(--duorain-idle-text); }
            #duorain-status-indicator.running { background-color: var(--duorain-running-bg); }
            #duorain-status-indicator.running p { color: var(--duorain-running-text); }
        `;

        document.body.insertAdjacentHTML('beforeend', uiHTML);
        GM_addStyle(uiStyle);

        const mainContainer = document.getElementById('duorain-main-container');
        const tasksContainer = document.getElementById('duorain-tasks-container');

        document.getElementById('duorain-toggle-button').addEventListener('click', () => {
            mainContainer.classList.toggle('duorain-hidden');
            tasksContainer.classList.add('duorain-hidden'); // Always hide tasks when toggling main
        });

        document.getElementById('duorain-status-indicator').addEventListener('click', () => {
            if (activeFarms.size > 0) {
                mainContainer.classList.add('duorain-hidden');
                tasksContainer.classList.remove('duorain-hidden');
            }
        });

        document.getElementById('duorain-close-tasks-button').addEventListener('click', () => {
            tasksContainer.classList.add('duorain-hidden');
            mainContainer.classList.remove('duorain-hidden');
        });
    }

    const activeFarms = new Map();

    function updateMasterStatus() {
        const indicator = document.getElementById('duorain-status-indicator');
        const indicatorText = document.getElementById('duorain-status-indicator-text');
        const farmCount = activeFarms.size;

        if (farmCount > 0) {
            indicator.classList.remove('idle');
            indicator.classList.add('running');
            indicatorText.textContent = `Status: Running (${farmCount})`;
        } else {
            indicator.classList.remove('running');
            indicator.classList.add('idle');
            indicatorText.textContent = 'Status: Idle';
            document.getElementById('duorain-tasks-container').classList.add('duorain-hidden'); // Hide tasks panel when all finish
        }
    }

    function addFarmUI(farmId, message) {
        const container = document.getElementById('duorain-running-tasks-list-content');
        const farmBox = document.createElement('div');
        farmBox.id = `farm-status-${farmId}`;
        farmBox.className = 'duorain-farm-status-box';
        farmBox.innerHTML = `<p class="DLP_Text_Style_1 status-text">${message}</p><button class="duorain-button-stop">Stop</button>`;
        farmBox.querySelector('.duorain-button-stop').addEventListener('click', () => stopFarm(farmId));
        container.appendChild(farmBox);
        updateMasterStatus();
    }

    function updateFarmStatus(farmId, message) {
        const farmBox = document.getElementById(`farm-status-${farmId}`);
        if (farmBox) farmBox.querySelector('.status-text').textContent = message;
    }

    function finalizeFarmUI(farmId, finalMessage) {
        const farmBox = document.getElementById(`farm-status-${farmId}`);
        if (farmBox) {
            farmBox.querySelector('.status-text').textContent = finalMessage;
            farmBox.querySelector('.duorain-button-stop').disabled = true;
            setTimeout(() => {
                if(farmBox) farmBox.remove();
                updateMasterStatus();
            }, 5000);
        }
    }

    function stopFarm(farmId, isManual = true) {
        if (!activeFarms.has(farmId)) return;
        activeFarms.set(farmId, false);
        activeFarms.delete(farmId);
        updateMasterStatus();
        const domId = `duorain-start-${farmId}-farm`;
        const button = document.getElementById(domId);
        if(button) {
            button.style.pointerEvents = 'auto';
            button.style.opacity = 1;
        }
        if (isManual) {
            finalizeFarmUI(farmId, "Stopped.");
        }
    }

    function getDuoHeaders(jwt) {
        return { "authorization": `Bearer ${jwt}`, "cookie": `jwt_token=${jwt}`, "connection": "Keep-Alive", "content-type": "application/json", "user-agent": navigator.userAgent };
    }

    function getUserData(jwt, sub) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET", url: `https://www.duolingo.com/2017-06-30/users/${sub}`, headers: getDuoHeaders(jwt),
                onload: (response) => {
                    if (response.status >= 200 && response.status < 300) {
                        const data = JSON.parse(response.responseText);
                        resolve({ fromLanguage: data.fromLanguage || 'en', learningLanguage: data.learningLanguage || 'es', streakStartDate: data.streakData?.currentStreak?.startDate });
                    } else reject(new Error(`HTTP error! status: ${response.status}`));
                },
                onerror: (error) => reject(error)
            });
        });
    }

    async function farmXp(jwt, fromLang, toLang, count) {
        const farmId = 'xp';
        if (activeFarms.has(farmId)) return;
        activeFarms.set(farmId, true);
        document.getElementById('duorain-start-xp-farm').style.pointerEvents = 'none';
        document.getElementById('duorain-start-xp-farm').style.opacity = 0.5;
        addFarmUI(farmId, "Starting XP farm...");
        let totalXp = 0; let loopShouldContinue = true;
        for (let i = 0; i < count; i++) {
            if (!activeFarms.get(farmId)) { loopShouldContinue = false; break; }
            const now_ts = Math.floor(Date.now() / 1000);
            const payload = { "awardXp": true, "completedBonusChallenge": true, "fromLanguage": fromLang, "learningLanguage": toLang, "hasXpBoost": false, "illustrationFormat": "svg", "isFeaturedStoryInPracticeHub": true, "isLegendaryMode": true, "isV2Redo": false, "isV2Story": false, "masterVersion": true, "maxScore": 0, "score": 0, "happyHourBonusXp": 469, "startTime": now_ts, "endTime": now_ts };
            await new Promise(resolve => {
                GM_xmlhttpRequest({
                    method: "POST", url: `https://stories.duolingo.com/api2/stories/fr-en-le-passeport/complete`,
                    headers: getDuoHeaders(jwt), data: JSON.stringify(payload),
                    onload: res => {
                        if (res.status === 200 && activeFarms.get(farmId)) {
                            totalXp += JSON.parse(res.responseText).awardedXp || 0;
                            updateFarmStatus(farmId, `XP Loop ${i + 1}/${count} | Total: ${totalXp}`);
                        } else if (activeFarms.get(farmId)) {
                           updateFarmStatus(farmId, `Error on loop ${i + 1}.`); loopShouldContinue = false;
                        }
                        resolve();
                    },
                    onerror: () => { if (activeFarms.get(farmId)) { updateFarmStatus(farmId, `Request failed.`); loopShouldContinue = false; } resolve(); }
                });
            });
            if (!loopShouldContinue) break; await new Promise(r => setTimeout(r, 600));
        }
        stopFarm(farmId, false);
        finalizeFarmUI(farmId, loopShouldContinue ? `Finished! Total: ${totalXp} XP` : "Stopped due to error.");
    }

    async function farmGems(jwt, uid, fromLang, toLang, count) {
        const farmId = 'gem';
        if (activeFarms.has(farmId)) return;
        activeFarms.set(farmId, true);
        const button = document.getElementById('duorain-start-gem-farm');
        button.style.pointerEvents = 'none'; button.style.opacity = 0.5;
        addFarmUI(farmId, "Starting Gem farm...");
        let totalGems = 0;
        let loopShouldContinue = true;
        for (let i = 0; i < count; i++) {
            if (!activeFarms.get(farmId)) { loopShouldContinue = false; break; }
            for (const reward of ["SKILL_COMPLETION_BALANCED-...-2-GEMS", "SKILL_COMPLETION_BALANCED-...-2-GEMS"]) {
                await new Promise(resolve => GM_xmlhttpRequest({ method: 'PATCH', url: `https://www.duolingo.com/2017-06-30/users/${uid}/rewards/${reward}`, headers: getDuoHeaders(jwt), data: JSON.stringify({ "consumed": true, "fromLanguage": fromLang, "learningLanguage": toLang }), onload: res => { if (res.status !== 200) console.warn(`Failed to redeem ${reward}`); resolve(); }, onerror: () => { console.error(`Error redeeming ${reward}`); resolve(); } }));
            }
            totalGems += 120; updateFarmStatus(farmId, `Gem Loop ${i + 1}/${count} | Total: ~${totalGems}`);
            if (!loopShouldContinue) break; await new Promise(r => setTimeout(r, 500));
        }
        stopFarm(farmId, false);
        finalizeFarmUI(farmId, loopShouldContinue ? `Finished! Total: ~${totalGems} Gems` : "Stopped.");
    }

    async function farmStreak(jwt, uid, fromLang, toLang, days) {
        const farmId = 'streak';
        if (activeFarms.has(farmId)) return;
        addFarmUI(farmId, "Getting user data...");
        const userData = await getUserData(jwt, uid).catch(() => {
            stopFarm(farmId, false);
            finalizeFarmUI(farmId, "Error: Could not get user data.");
            return null;
        });
        if (!userData) return;
        activeFarms.set(farmId, true);
        document.getElementById('duorain-start-streak-farm').style.pointerEvents = 'none'; document.getElementById('duorain-start-streak-farm').style.opacity = 0.5;
        const startDate = userData.streakStartDate ? new Date(userData.streakStartDate) : new Date();
        let loopShouldContinue = true;
        for (let i = 0; i < days; i++) {
            if (!activeFarms.get(farmId)) { loopShouldContinue = false; break; }
            const simDay = new Date(startDate); simDay.setDate(simDay.getDate() - i);
            updateFarmStatus(farmId, `Farming ${simDay.toISOString().split('T')[0]}`);
            await new Promise(resolve => { GM_xmlhttpRequest({ method: 'POST', url: "https://www.duolingo.com/2017-06-30/sessions", headers: getDuoHeaders(jwt), data: JSON.stringify({ "challengeTypes": [], "fromLanguage": fromLang, "isFinalLevel": false, "isV2": true, "juicy": true, "learningLanguage": toLang, "type": "GLOBAL_PRACTICE" }), onload: r1 => { if (r1.status !== 200) { console.error(`POST fail for ${simDay.toISOString().split('T')[0]}`); return resolve(); } const sessionData = JSON.parse(r1.responseText); const putPayload = { ...sessionData, "heartsLeft": 5, "startTime": Math.floor((simDay.getTime() / 1000) - 60), "endTime": Math.floor(simDay.getTime() / 1000), "failed": false }; GM_xmlhttpRequest({ method: 'PUT', url: `https://www.duolingo.com/2017-06-30/sessions/${sessionData.id}`, headers: getDuoHeaders(jwt), data: JSON.stringify(putPayload), onload: resolve, onerror: resolve }); }, onerror: resolve }); });
            if (!loopShouldContinue) break; await new Promise(r => setTimeout(r, 500));
        }
        stopFarm(farmId, false);
        finalizeFarmUI(farmId, loopShouldContinue ? "🎉 Streak farming complete!" : "Stopped.");
    }

    async function main() {
        injectUI();
        const jwt = getJwtToken();
        const indicatorText = document.getElementById('duorain-status-indicator-text');
        const inputsContainer = document.getElementById('DLP_Main_Inputs_1_Divider_1_ID');
        if (!jwt || !parseJwt(jwt)?.sub) {
            indicatorText.textContent = 'Error: Not logged in.'; inputsContainer.style.opacity = 0.5; inputsContainer.style.pointerEvents = 'none'; return;
        }
        const userId = parseJwt(jwt).sub;
        try {
            const userData = await getUserData(jwt, userId);
            const { fromLanguage, learningLanguage } = userData;
            document.getElementById('duorain-start-xp-farm').addEventListener('click', () => { const count = parseInt(document.getElementById('duorain-xp-loops-input').value, 10); if (count > 0) farmXp(jwt, fromLanguage, 'fr', count); });
            document.getElementById('duorain-start-gem-farm').addEventListener('click', () => { const count = parseInt(document.getElementById('duorain-gem-loops-input').value, 10); if (count > 0) farmGems(jwt, userId, fromLanguage, learningLanguage, count); });
            document.getElementById('duorain-start-streak-farm').addEventListener('click', () => { const count = parseInt(document.getElementById('duorain-streak-days-input').value, 10); if (count > 0) farmStreak(jwt, userId, fromLanguage, learningLanguage, count); });
        } catch (error) {
            indicatorText.textContent = 'Init failed, see console.'; console.error("DuoRain Init Error:", error);
        }
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }

})();
