// ==UserScript==
// @name         DuoRain BETA
// @namespace    http://tampermonkey.net/
// @version      2.3
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
 
    // Global settings variable
    let loopDelay = 200; // Default delay set to 200ms
 
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
                        <div class="DLP_HStack_8" style="margin-bottom: 8px;">
                           <div id="duorain-status-indicator" class="DLP_Button_Style_1 DLP_Magnetic_Hover_1 DLP_NoSelect idle">
                                <p id="duorain-status-indicator-text" class="DLP_Text_Style_1">Idle</p>
                           </div>
                             <div id="duorain-settings-button" class="duorain-icon-button DLP_Button_Style_1 DLP_Magnetic_Hover_1 DLP_NoSelect">
                               <svg viewBox="0 0 90 90" class="duorain-settings-svg">
                                <path d="M 31.018 18.844 L 31.018 18.844 c -2.967 -1.229 -2.967 -5.431 0 -6.66 l 0 0 c 0.421 -0.174 0.621 -0.657 0.447 -1.078 L 29.91 7.352 c -0.174 -0.421 -0.657 -0.621 -1.078 -0.447 l 0 0 c -2.967 1.229 -5.938 -1.743 -4.709 -4.709 l 0 0 c 0.174 -0.421 -0.026 -0.904 -0.447 -1.078 l -3.754 -1.555 c -0.421 -0.174 -0.904 0.026 -1.078 0.447 c -1.229 2.967 -5.431 2.967 -6.66 0 c -0.174 -0.421 -0.657 -0.621 -1.078 -0.447 L 7.352 1.117 C 6.931 1.292 6.731 1.775 6.905 2.196 c 1.229 2.967 -1.743 5.938 -4.71 4.71 C 1.775 6.731 1.292 6.931 1.117 7.352 l -1.555 3.753 c -0.174 0.421 0.026 0.904 0.447 1.078 l 0 0 c 2.967 1.229 2.967 5.431 0 6.66 l 0 0 c -0.421 0.174 -0.621 0.657 -0.447 1.078 l 1.555 3.753 c 0.174 0.421 0.657 0.621 1.078 0.447 l 0 0 c 2.967 -1.229 5.938 1.743 4.709 4.71 l 0 0 C 6.73 29.253 6.93 29.736 7.351 29.91 l 3.753 1.555 c 0.421 0.174 0.904 -0.026 1.078 -0.447 l 0 0 c 1.229 -2.967 5.431 -2.967 6.66 0 l 0 0 c 0.174 0.421 0.657 0.621 1.078 0.447 l 3.753 -1.555 c 0.421 -0.174 0.621 -0.657 0.447 -1.078 l 0 0 c -1.229 -2.967 1.743 -5.938 4.71 -4.709 c 0.421 0.174 0.904 -0.026 1.078 -0.447 l 1.555 -3.753 C 31.639 19.501 31.439 19.018 31.018 18.844 z M 15.514 22.294 c -3.744 0 -6.78 -3.036 -6.78 -6.78 s 3.036 -6.78 6.78 -6.78 s 6.78 3.036 6.78 6.78 S 19.258 22.294 15.514 22.294 z" transform="matrix(2.81 0 0 2.81 1.4065934065934016 1.4065934016)"/>
                                </svg>
                            </div>
                            <div id="DLP_Main_GitHub_Button_1_ID" class="duorain-icon-button DLP_Button_Style_1 DLP_Magnetic_Hover_1 DLP_NoSelect">
                                <svg width="22" height="22" viewBox="0 0 22 22" fill="#FFF" xmlns="http://www.w3.org/2000/svg">
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M11.0087 0.5C5.19766 0.5 0.5 5.3125 0.5 11.2662C0.5 16.0253 3.50995 20.0538 7.68555 21.4797C8.2076 21.5868 8.39883 21.248 8.39883 20.963C8.39883 20.7134 8.38162 19.8578 8.38162 18.9664C5.45836 19.6082 4.84962 17.683 4.84962 17.683C4.37983 16.4353 3.68375 16.1146 3.68375 16.1146C2.72697 15.4551 3.75345 15.4551 3.75345 15.4551C4.81477 15.5264 5.37167 16.5602 5.37167 16.5602C6.31103 18.1999 7.82472 17.7366 8.43368 17.4514C8.52058 16.7562 8.79914 16.2749 9.09491 16.0076C6.7634 15.758 4.31035 14.8312 4.31035 10.6957C4.31035 9.51928 4.72765 8.55678 5.38888 7.80822C5.28456 7.54091 4.9191 6.43556 5.49342 4.95616C5.49342 4.95616 6.38073 4.67091 8.38141 6.06128C9.23797 5.82561 10.1213 5.70573 11.0087 5.70472C11.896 5.70472 12.8005 5.82963 13.6358 6.06128C15.6367 4.67091 16.524 4.95616 16.524 4.95616C17.0983 6.43556 16.7326 7.54091 16.6283 7.80822C17.3069 8.55678 17.707 9.51928 17.707 10.6957C17.707 14.8312 15.254 15.7401 12.905 16.0076C13.2879 16.3463 13.6183 16.9878 13.6183 18.0039C13.6183 19.4477 13.6011 20.6064 13.6011 20.9627C13.6011 21.248 13.7926 21.5868 14.3144 21.4799C18.49 20.0536 21.5 16.0253 21.5 11.2662C21.5172 5.3125 16.8023 0.5 11.0087 0.5Z"/>
                                </svg>
                            </div>
                            <div id="duorain-more-button" class="DLP_Button_Style_1 duorain-more-button DLP_Magnetic_Hover_1 DLP_NoSelect">
                                <p class="DLP_Text_Style_1" style="color: #FFF; font-weight: bold;">MORE &gt;&gt;</p>
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
             <div id="duorain-settings-container" class="duorain-hidden">
                 <div class="DLP_Main_Box">
                    <div class="DLP_VStack_8">
                       <div class="DLP_HStack_Auto_Top DLP_NoSelect">
                            <p class="DLP_Text_Style_2">Settings</p>
                            <div id="duorain-close-settings-button" class="DLP_Magnetic_Hover_1" style="cursor: pointer; padding: 4px;">
                                 <p class="DLP_Text_Style_1" style="font-size: 14px; opacity: 0.8;">BACK</p>
                            </div>
                        </div>
                        <div id="duorain-settings-content" class="DLP_VStack_8" style="margin-top: 8px;">
                            <div class="duorain-setting-row DLP_HStack_8">
                                <p class="DLP_Text_Style_1">Loop Delay (ms)</p>
                                <div class="DLP_HStack_8">
                                    <div class="DLP_Input_Style_1_Active duorain-small-input">
                                        <input type="number" min="100" id="duorain-loop-delay-input" class="DLP_Input_Input_Style_1">
                                    </div>
                                    <div class="duorain-info-icon" data-tooltip="the delay in milliseconds between each farm loop, Default: 200 ms.">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                                          <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="duorain-more-container" class="duorain-hidden">
                 <div class="DLP_Main_Box">
                    <div class="DLP_VStack_8">
                       <div class="DLP_HStack_Auto_Top DLP_NoSelect">
                            <p class="DLP_Text_Style_2">More Features</p>
                            <div id="duorain-close-more-button" class="DLP_Magnetic_Hover_1" style="cursor: pointer; padding: 4px;">
                                 <p class="DLP_Text_Style_1" style="font-size: 14px; opacity: 0.8;">BACK</p>
                            </div>
                        </div>
                        <div id="duorain-more-content" class="DLP_VStack_8" style="margin-top: 8px;">
                           <p class="DLP_Text_Style_1" style="opacity: 0.7;">More features coming soon!</p>
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
                --duorain-icon-btn-outline: rgba(0,0,0,0.08);
                --duorain-input-bg: rgba(0, 122, 255, 0.10);
                --duorain-input-outline: rgba(0, 122, 255, 0.20);
                --duorain-input-text: #007AFF;
                --duorain-input-placeholder: rgba(0, 122, 255, 0.5);
                --duorain-status-box-bg: rgba(0, 0, 0, 0.05);
                --duorain-idle-bg: rgb(var(--color-eel), 0.10);
                --duorain-idle-text: rgb(var(--color-eel));
                --duorain-running-bg: rgba(255, 149, 0, 0.2);
                --duorain-running-text: #f57c00;
                --duorain-tooltip-bg: #333;
                --duorain-tooltip-text: #fff;
            }
 
            html._2L9MF {
                --duorain-bg-color: rgb(var(--color-gray-9), 0.8);
                --duorain-text-color: rgb(var(--color-snow));
                --duorain-border-color: rgb(var(--color-gray-2), 0.10);
                --duorain-icon-btn-outline: rgba(255,255,255,0.2);
                --duorain-input-bg: rgba(0, 0, 0, 0.2);
                --duorain-input-outline: rgba(0, 122, 255, 0.20);
                --duorain-input-text: #89CFF0;
                --duorain-input-placeholder: rgba(137, 207, 240, 0.5);
                --duorain-status-box-bg: rgba(0,0,0,0.2);
                --duorain-idle-bg: rgba(120, 120, 128, 0.2);
                --duorain-idle-text: rgba(255,255,255,0.6);
                --duorain-running-bg: rgba(255, 149, 0, 0.3);
                --duorain-running-text: #FFD580;
                --duorain-tooltip-bg: #F2F2F2;
                --duorain-tooltip-text: #333;
            }
 
            @font-face { font-family: 'DuoRain'; src: url(https://raw.githubusercontent.com/SlimyThor/DuoRain.Site/main/DuoRain.woff2) format('woff2'); font-weight: 600; }
            .DLP_NoSelect { -webkit-user-select: none; -ms-user-select: none; user-select: none; }
            .DLP_Text_Style_1 { font-family: "DuoRain", sans-serif; font-size: 16px; font-weight: 500; margin: 0; transition: color 0.4s ease; }
            .DLP_Text_Style_2 { font-family: "DuoRain", sans-serif; font-size: 24px; font-weight: 500; margin: 0; transition: color 0.4s ease; }
            .duorain-neon-blue { color: #03A9F4; text-shadow: 0 0 2px #03A9F4, 0 0 6px #2196F3; }
            .DLP_Magnetic_Hover_1 { transition: filter 0.4s, transform 0.4s; cursor: pointer; }
            .DLP_Magnetic_Hover_1:hover { filter: brightness(0.9); transform: scale(1.05); }
            .DLP_Magnetic_Hover_1:active { filter: brightness(0.9); transform: scale(0.9); }
            #duorain-main-container, #duorain-tasks-container, #duorain-settings-container, #duorain-more-container { display: flex; flex-direction: column; gap: 8px; position: fixed; right: 16px; bottom: 80px; z-index: 9999; transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            #duorain-main-container.duorain-hidden, #duorain-tasks-container.duorain-hidden, #duorain-settings-container.duorain-hidden, #duorain-more-container.duorain-hidden { opacity: 0; transform: scale(0.95) translateY(20px); pointer-events: none; }
            .DLP_Main_Box { display: flex; width: 340px; padding: 24px 20px; box-sizing: border-box; flex-direction: column; gap: 8px; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.25); transition: background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease; background: var(--duorain-bg-color); backdrop-filter: blur(16px) saturate(180%); -webkit-backdrop-filter: blur(16px) saturate(180%); border: 1px solid var(--duorain-border-color); }
            .DLP_HStack_Auto_Top, .DLP_HStack_4, .DLP_HStack_8 { display: flex; align-items: center; align-self: stretch; }
            .DLP_HStack_Auto_Top { justify-content: space-between; align-items: flex-start; }
            .DLP_HStack_4 { gap: 4px; }
            .DLP_HStack_8 { gap: 8px; }
            .DLP_VStack_8 { display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 8px; align-self: stretch; }
            .DLP_Button_Style_1 { display: flex; height: 40px; padding: 10px 12px; box-sizing: border-box; align-items: center; gap: 6px; flex: 1 0 0; border-radius: 12px; }
            .duorain-icon-button { justify-content: center; flex: none; width: 40px; padding: 10px; outline: 2px solid var(--duorain-icon-btn-outline); outline-offset: -2px; transition: background-color 0.4s, outline-color 0.4s; }
            .duorain-more-button { justify-content: center; flex: none; padding: 10px 14px; background: linear-gradient(135deg, #00E29A, #00BFFF, #C64EFF); box-shadow: 0 0 10px rgba(0, 191, 255, 0.5); }
            #DLP_Main_GitHub_Button_1_ID { background: #333333; }
            #duorain-settings-button { background-color: var(--duorain-status-box-bg); }
            .duorain-settings-svg { width: 22px; height: 22px; }
            .duorain-settings-svg path { fill: var(--duorain-text-color); transition: fill 0.4s ease; }
            .DLP_Input_Style_1_Active { display: flex; height: 48px; padding: 16px; box-sizing: border-box; align-items: center; flex: 1 0 0; gap: 6px; border-radius: 8px; transition: background 0.4s ease, outline 0.4s ease; background: var(--duorain-input-bg); outline: 2px solid var(--duorain-input-outline); }
            .DLP_Input_Button_Style_1_Active { display: flex; height: 48px; padding: 12px; box-sizing: border-box; justify-content: center; align-items: center; gap: 6px; border-radius: 8px; border: none; background: linear-gradient(135deg, #00E29A, #00BFFF, #C64EFF); background-size: 300% 300%; animation: duoRainNeonGradient 4s ease infinite; box-shadow: 0 0 10px rgba(0, 191, 255, 0.6); }
            @keyframes duoRainNeonGradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
            .DLP_Input_Input_Style_1 { border: none; outline: none; background: none; text-align: left; font-family: "DuoRain", sans-serif; font-size: 16px; font-weight: 500; width: 100%; transition: color 0.4s ease; color: var(--duorain-input-text); }
            .DLP_Input_Input_Style_1::placeholder { transition: color 0.4s ease; color: var(--duorain-input-placeholder); }
            .DLP_Input_Input_Style_1::-webkit-outer-spin-button, .DLP_Input_Input_Style_1::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
            #duorain-status-indicator { justify-content: center; transition: all 0.3s ease; }
            #duorain-running-tasks-list-content, #duorain-settings-content { width: 100%; }
            .duorain-farm-status-box { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-radius: 12px; transition: background-color 0.4s ease; background-color: var(--duorain-status-box-bg); width: 100%; box-sizing: border-box; }
            .duorain-farm-status-box .status-text { font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .duorain-farm-status-box .duorain-button-stop { padding: 4px 10px; border-radius: 8px; border: none; background-color: #FF3B30; color: white; font-size: 12px; font-weight: bold; cursor: pointer; transition: background-color 0.2s; }
            #duorain-toggle-button { position: fixed; bottom: 20px; right: 20px; background-image: linear-gradient(45deg, #007AFF, #5AC8FA); color: white; padding: 12px 18px; border-radius: 50px; cursor: pointer; font-family: "DuoRain", sans-serif; font-weight: bold; box-shadow: 0 5px 20px rgba(0, 122, 255, 0.35); z-index: 10000; }
            .duorain-setting-row { justify-content: space-between; align-items: center; width: 100%; }
            .duorain-small-input { height: 40px; width: 80px; padding: 12px; }
            .duorain-small-input input { text-align: center !important; }
            .duorain-info-icon { position: relative; cursor: help; display: flex; align-items: center; justify-content: center; }
            .duorain-info-icon svg { width: 20px; height: 20px; fill: var(--duorain-text-color); opacity: 0.7; transition: opacity 0.3s ease; }
            .duorain-info-icon:hover::after { content: attr(data-tooltip); position: absolute; top: 50%; right: 120%; transform: translateY(-50%); width: 240px; background-color: var(--duorain-tooltip-bg); color: var(--duorain-tooltip-text); padding: 8px 10px; border-radius: 6px; font-size: 14px; font-family: "DuoRain", sans-serif; font-weight: 500; z-index: 10001; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
            .duorain-info-icon:hover svg { opacity: 1; }
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
        const settingsContainer = document.getElementById('duorain-settings-container');
        const moreContainer = document.getElementById('duorain-more-container');
 
        document.getElementById('duorain-toggle-button').addEventListener('click', () => {
            mainContainer.classList.toggle('duorain-hidden');
            tasksContainer.classList.add('duorain-hidden');
            settingsContainer.classList.add('duorain-hidden');
            moreContainer.classList.add('duorain-hidden');
        });
 
        document.getElementById('duorain-status-indicator').addEventListener('click', () => {
            if (activeFarms.size > 0) {
                mainContainer.classList.add('duorain-hidden');
                settingsContainer.classList.add('duorain-hidden');
                moreContainer.classList.add('duorain-hidden');
                tasksContainer.classList.remove('duorain-hidden');
            }
        });
 
        document.getElementById('duorain-close-tasks-button').addEventListener('click', () => {
            tasksContainer.classList.add('duorain-hidden');
            mainContainer.classList.remove('duorain-hidden');
        });
 
        document.getElementById('duorain-settings-button').addEventListener('click', () => {
            mainContainer.classList.add('duorain-hidden');
            tasksContainer.classList.add('duorain-hidden');
            moreContainer.classList.add('duorain-hidden');
            settingsContainer.classList.remove('duorain-hidden');
        });
 
        document.getElementById('duorain-close-settings-button').addEventListener('click', () => {
            settingsContainer.classList.add('duorain-hidden');
            mainContainer.classList.remove('duorain-hidden');
        });
 
        document.getElementById('duorain-more-button').addEventListener('click', () => {
            mainContainer.classList.add('duorain-hidden');
            tasksContainer.classList.add('duorain-hidden');
            settingsContainer.classList.add('duorain-hidden');
            moreContainer.classList.remove('duorain-hidden');
        });
 
        document.getElementById('duorain-close-more-button').addEventListener('click', () => {
            moreContainer.classList.add('duorain-hidden');
            mainContainer.classList.remove('duorain-hidden');
        });
 
        document.getElementById('DLP_Main_GitHub_Button_1_ID').addEventListener('click', () => {
            window.open('https://github.com/OracleMythix/DuoRain-BETA', '_blank');
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
            indicatorText.textContent = `Running (${farmCount})`;
        } else {
            indicator.classList.remove('running');
            indicator.classList.add('idle');
            indicatorText.textContent = 'Idle';
            document.getElementById('duorain-tasks-container').classList.add('duorain-hidden');
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
            if (!loopShouldContinue) break; await new Promise(r => setTimeout(r, loopDelay));
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
            if (!loopShouldContinue) break; await new Promise(r => setTimeout(r, loopDelay));
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
            if (!loopShouldContinue) break; await new Promise(r => setTimeout(r, loopDelay));
        }
        stopFarm(farmId, false);
        finalizeFarmUI(farmId, loopShouldContinue ? "🎉 Streak farming complete!" : "Stopped.");
    }
 
     function initializeSettings() {
        const savedDelay = localStorage.getItem('duorain_loop_delay');
        if (savedDelay && !isNaN(parseInt(savedDelay, 10))) {
            loopDelay = parseInt(savedDelay, 10);
        }
        const loopDelayInput = document.getElementById('duorain-loop-delay-input');
        loopDelayInput.value = loopDelay;
 
        loopDelayInput.addEventListener('change', () => {
            const newValue = parseInt(loopDelayInput.value, 10);
            if (!isNaN(newValue) && newValue >= 100) {
                loopDelay = newValue;
                localStorage.setItem('duorain_loop_delay', loopDelay);
            } else { // Reset to current valid value if input is bad
                loopDelayInput.value = loopDelay;
            }
        });
    }
 
    async function main() {
        injectUI();
        initializeSettings();
 
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
