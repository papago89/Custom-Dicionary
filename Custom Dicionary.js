// ==UserScript==
// @name         Custom Dictionary(自製字典庫)
// @namespace    http://tampermonkey.net/
// @description  Custom Dictionary(自製字典庫)：設定自己的字典庫，可在任意網頁幫助查找，貼上。
// @version      0.1
// @author       papago89
// @match        https://*/*
// @match        http://*/*
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @require      https://cdn.staticfile.org/jquery/1.10.2/jquery.min.js
// @include      @
// @license MIT
// ==/UserScript==

let dictionaryJSON = {
    "OA-Reply pattern": {
        "name": "OA 制式化回覆內容",
        "data": [
            {
                "value": "一. 資料庫平台: Oracle\n二. 變更環境: PROD\n三. Stage環境: 無\n四. 系統/業務名稱: EDLS\n五. 主機名稱: oradb-edlsp.esunbank.com.tw\n六. IP: 10.230.204.40-42\n七. Port: 4031\n八. 資料庫名稱: EDLSP\n九. Schema: EDLS\n十. 執行時機: 隨時\n十一. 變更類別: 更新資料\n十二. 變更內容:\n　1. ",
                "description": "EDLS DB 變更"
            },
            {
                "value": "因應業管開立需求，擬進行人工批次作業(EDLS 營運帳務沖轉 HAC5 產出)\n\n1.請 SP 將檔案(20220523_REVERSE_T504_0749140085515_HAC5.txt)放置到 10.230.202.64 的 /edls/tempdata/deposit/K07/ 路徑下並給予 CTMBatchUser 750 的權限\n2.請 SP 將檔案(20220523_REVERSE_T504_0749140085515_HAC5.txt)放置到 10.230.202.65 的 /edls/tempdata/deposit/K07/ 路徑下並給予 CTMBatchUser 750 的權限\n3.請 SP 將檔案(20220523-0749140085515-DpK07Ot000201B01.sh)放置到 10.230.202.51 的 /home/CTMBatchUser/ 路徑下並給予 CTMBatchUser 755 的權限\n4.請 SP 切換使用者 CTMBatchUser 並切換到 10.230.202.51 的 /home/CTMBatchUser/ 路徑下\n5.請 SP 執行 sh 20220523-0749140085515-DpK07Ot000201B01.sh 並告知執行結果\n6.執行完畢後請將相關檔案自 VM 刪除(1~3 步驟的檔案：20220523_REVERSE_T504_0749140085515_HAC5.txt、20220523-0749140085515-DpK07Ot000201B01.sh)",
                "description": "HAC5 跑批"
            }
        ]
    },
    "TS0108-Document": {
        "name": "TS0108-Document",
        "url": "https://eip.esunbank.com.tw/sites/C105/DocLib57/F00-中心共用區/Confluence/EDLS/系統分析/共用設定/TS0108-Document"
    },
    "TS0108-DB Object": {
        "name": "TS0108-DB Object",
        "url": "https://eip.esunbank.com.tw/sites/C105/DocLib57/F00-中心共用區/Confluence/EDLS/系統分析/共用設定/TS0108-DB Object"
    },
    "TS0110-Document": {
        "name": "TS0110-Document",
        "url": "https://eip.esunbank.com.tw/sites/C105/DocLib57/F00-中心共用區/Confluence/EDLS/系統分析/共用設定/TS0110-Document"
    },
    "TS0110-DB Object": {
        "name": "TS0110-DB Object",
        "url": "https://eip.esunbank.com.tw/sites/C105/DocLib57/F00-中心共用區/Confluence/EDLS/系統分析/共用設定/TS0110-DB Object"
    }
};

// 控制快捷鍵計數
let ctrlClickCounter = 0;
let ctrlCleanTimeout = null;

// overlay 相關控制
let isShowOverlay = false;
let xPlace = null;
let yPlace = null;

// 保留原先關注的元素便於回覆
let originActiveElement = null;

// 紀錄現在應該指在哪一格資料上
let xActive = 0;
let yActive = 0;

// 符合現在條件的資料
let matchKeyData = {};

(function () {
    'use strict';
    GM_addStyle("table.dicionary {background:inherit;table-layout:fixed;overflow:hidden;}}");
    GM_addStyle("tbody.dicionary,thead.dicionary,tr.dicionary {background:inherit;overflow:hidden;}");
    GM_addStyle("th.dicionary {padding:5px;text-align:center;background:inherit;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}");
    GM_addStyle("td.dicionary {padding:5px;background:inherit;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}");
    GM_addStyle("td.active,th.active {border:1px solid blue;font-weight:bold;color:yellow;background:rgba(255,10,20,0.5);}");
    GM_addStyle("td.dicionary:hover {white-space:normal;overflow:auto}");

    $(document).keyup(e => {
        if (17 == e.keyCode) {
            ++ctrlClickCounter;
            if (null != ctrlCleanTimeout) {
                clearTimeout(ctrlCleanTimeout)
            }
            if (3 == ctrlClickCounter) {
                generateOverlayWhenNotExists();
                if (!isShowOverlay) {
                    displayOverlay();
                } else {
                    undisplayOverlay();
                }
                ctrlClickCounter = 0;
            } else {
                ctrlCleanTimeout = setTimeout(() => ctrlClickCounter = 0, 350);
            }
        }
    });

    $(document).mousemove(e => {
        xPlace = e.pageX;
        yPlace = e.pageY;
    });
})();

function init() {
    let gmJSON = GM_getValue('dictionaryJSON');
    if (null != gmJSON) {
        processDictionaryJSON(gmJSON);
    }
}

function processDictionaryJSON(originalJSON) {
    let promiseList = [];
    for (let key of Object.keys(originalJSON)) {
        if (null != originalJSON[key].url) {
            promiseList.push(new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: originalJSON[key].url,
                    headers: {
                        'User-Agent': 'Mozilla/5.0',
                        'Accept': 'text/json',
                        'Content-Type': 'application/json'
                    },
                    responseType: 'json',
                    onload: function (response) {
                        let tempJSON = Object.assign({}, originalJSON[key]);
                        delete tempJSON['url'];
                        tempJSON.data = response.response;
                        resolve({ 'key': key, 'obj': tempJSON });
                    }
                });
            }));
        }
    }
    if (promiseList.length > 0) {
        Promise.all(promiseList).then(values => {
            for (let value of values) {
                originalJSON[value.key] = value.obj;
            }
            dictionaryJSON = originalJSON;
            $('#dictionarySearchKey')[0].focus();
            searchKeyChangeTrigger($('#dictionarySearchKey')[0].value);
        });
    } else {
        dictionaryJSON = originalJSON;
        $('#dictionarySearchKey')[0].focus();
        searchKeyChangeTrigger($('#dictionarySearchKey')[0].value);
    }
}

function startSetting() {
    let top = (window.screen.height / 2) - 425;
    let left = (window.screen.width / 2) - 540;
    $('body').append(
        '  <div id="dictionarySetting" style="left: ' + left + 'px; top: ' + top + 'px; width: 680px; height: 550px; background: rgba(0, 161, 155, 0.5); color: #ffffff; z - index: 9998; position: fixed; padding: 5px; text - align: center; border - bottom - left - radius: 4px; border - bottom - right - radius: 4px; border - top - left - radius: 4px; border - top - right - radius: 4px;">\n' +
        '    <button id="saveThenCloseBtton" style="height: 40px;">點擊保存並關閉</button>\n' +
        '    <textarea id="dictionarySettingContent" style="top:40px; width: 680px; height: 510px; overflow-y: scroll; z - index: 9999; background: rgba(0, 171, 164, 0.5); color: #ffffff;"></textarea>\n' +
        '  </div>'
    );
    let gmValue = GM_getValue('dictionaryJSON');

    if (null == gmValue) {
        gmValue = dictionaryJSON;
    }

    $('#dictionarySettingContent')[0].value = JSON.stringify(gmValue);

    $('#saveThenCloseBtton').click(saveThenClose);
}

function saveThenClose() {
    let originalJSON = JSON.parse($('#dictionarySettingContent')[0].value);
    GM_setValue('dictionaryJSON', originalJSON);
    processDictionaryJSON(originalJSON);
    $('#dictionarySetting').remove();
}

/**
* 產生 Overlay
*/
function generateOverlayWhenNotExists() {
    if (null != $('#dictionaryOverlay')[0]) {
        return;
    }
    init();
    let top = (window.screen.height / 2) - 425;
    let left = (window.screen.width / 2) - 540;
    $('body').append(
        '  <div id="dictionaryOverlay" style="left: ' + left + 'px; top: ' + top + 'px; width: 680px; height: 550px; display:none; background: rgba(0, 161, 155, 0.5); color: #ffffff; overflow: hidden; z - index: 9998; position: fixed; padding: 5px; text - align: center; border - bottom - left - radius: 4px; border - bottom - right - radius: 4px; border - top - left - radius: 4px; border - top - right - radius: 4px;">\n' +
        '    <button id="dictionarySettingButton" style="font-size: 10px; height: 20px;">設定字典</button>\n' +
        '    <textarea id="dictionarySearchKey" style="top: 20px; width: 680px; height: 20px; background: rgba(0, 171, 164, 0.5); color: #ffffff;"></textarea>\n' +
        '    <div id="dictionaryMain" style="top: 40px; width: 680px; height: 510px; overflow-y: scroll;"></div>\n' +
        '  </div>'
    );

    $('#dictionarySettingButton').click(startSetting);

    matchKeyData = dictionaryJSON;
    generateTableByMatchKeyData();

    $(document).keydown(e => {

        debounce(() => {
            if (isShowOverlay && e.ctrlKey) {
                reCalculate(e);
                rePosition();
            }
        }, 100)();

    });

    $('#dictionarySearchKey').on('input propertychange', e => {
        if (13 == e.keyCode) {
            undisplayOverlay();
            let activeValue = $('#dictionaryData tr td.value.active')[0];
            if (null != activeValue && null != originActiveElement.value) {
                originActiveElement.value += decodeURI(activeValue.dataset.value);
            }
        } else {
            let searchKey = e.currentTarget.value;

            debounce(() => searchKeyChangeTrigger(searchKey), 750)();
        }
    });
}

function debounce(func, delay) {
    // timeout 初始值
    let timeout = null;
    return function () {
        let context = this;  // 指向 myDebounce 這個 input
        let args = arguments;  // KeyboardEvent
        clearTimeout(timeout)

        timeout = setTimeout(function () {
            func.apply(context, args)
        }, delay);
    };
}


/**
 * 根據 searchKey 的變更重新處理相關作業
 */
function searchKeyChangeTrigger(searchKey) {
    if (null != searchKey.match(/^\/(.*)\//)) {
        searchKey = searchKey.match(/^\/(.*)\//)[1];
    } else {
        searchKey = searchKey.replace(/([.(){}\[\]*+\\])/g, '\\$1')
    }
    filterData(new RegExp('.*' + searchKey + '.*'));
    generateTableByMatchKeyData();
}

/**
 * 篩選資料
 */
function filterData(regexp) {
    let temp = {};
    for (let key of Object.keys(dictionaryJSON)) {
        let tempCategory = Object.assign({}, dictionaryJSON[key]);
        tempCategory.data = tempCategory?.data?.filter(data => null != data.value.match(regexp) || null != data?.description?.match(regexp));
        if (tempCategory?.data?.length > 0) {
            temp[key] = tempCategory;
        }
    }
    matchKeyData = temp;
}

/**
 * 根據符合現行條件的內容產生資料
 */
function generateTableByMatchKeyData() {
    $('#dictionaryMain')[0].innerHTML = '';

    if (xActive >= Object.keys(matchKeyData).length) {
        xActive = 0;
    }

    let activeKey = Object.keys(matchKeyData)[xActive];

    if (yActive > matchKeyData[activeKey]?.data?.length) {
        yActive = 0;
    }

    let categoryHTML = '<table id="dictionaryCategory" class="dicionary" style="width:100%;"><thead><tr>';
    for (let key of Object.keys(matchKeyData)) {
        categoryHTML += `<th>${matchKeyData[key].name}</th>`;
    }
    categoryHTML += '</tr></thead></table>';
    $('#dictionaryMain').append(categoryHTML);

    let dataHTML = '<table id="dictionaryData" class="dicionary" style="width:100%;"><tbody>';

    for (let i in matchKeyData[activeKey]?.data) {
        let data = matchKeyData[activeKey]?.data[i];
        dataHTML += `<tr data-x-position="${xActive}" data-y-position="${i}"><td class="value" data-value="${encodeURI(data.value)}" style="width:70%;">${data.value}</td><td style="width:30%;">${null != data.description ? data.description : ''}</td></tr>`;
    }
    dataHTML += '</tbody></table>';
    $('#dictionaryMain').append(dataHTML);

    rePosition();
    $('#dictionaryData tr').click(e => {
        if (!isShowOverlay) {
            return;
        }
        xActive = parseInt(e.currentTarget.dataset.xPosition);
        yActive = parseInt(e.currentTarget.dataset.yPosition);
        rePosition();

        let activeValue = $('#dictionaryData tr td.value.active')[0];
        let decodedValue = decodeURI(activeValue.dataset.value);
        if (e.button == 0 && e.ctrlKey) {
            $('#dictionarySearchKey')[0].value = decodedValue;
            $('#dictionarySearchKey')[0].focus();
            searchKeyChangeTrigger(decodedValue);
        } else if (e.button == 0) {
            undisplayOverlay();
            if (null != originActiveElement.value) {
                originActiveElement.value += decodedValue;
            }
        }
    });
}

/**
 * 顯示 Overlay
 */
function displayOverlay() {
    $('#dictionaryOverlay')[0].style.display = '';
    $('#dictionaryOverlay')[0].style.left = xPlace + 'px';
    $('#dictionaryOverlay')[0].style.top = yPlace + 'px';
    $('#dictionaryOverlay')[0].style.top = yPlace + 'px';
    originActiveElement = document.activeElement;
    $('#dictionarySearchKey')[0].focus();
    isShowOverlay = !isShowOverlay;
}

/**
 * 隱藏 Overlay
 */
function undisplayOverlay() {
    $('#dictionaryOverlay')[0].style.display = 'none';
    $('#dictionarySearchKey')[0].value = '';
    originActiveElement.focus();
    isShowOverlay = !isShowOverlay;
}

/**
 * 計算現在有效索引的資料
 */
function reCalculate(e) {
    let dataCount = $('#dictionaryData tr').length;
    let categoryCount = Object.keys(matchKeyData).length;
    let switchCategory = false;

    if (37 == e.keyCode) { //move left or wrap
        if (xActive > 0) {
            xActive = xActive - 1;
            switchCategory = true;
        }
    }
    if (38 == e.keyCode) { // move up
        yActive = (yActive > 0) ? yActive - 1 : yActive;
    }
    if (39 == e.keyCode) { // move right or wrap
        if (xActive < categoryCount - 1) {
            xActive = xActive + 1;
            switchCategory = true;
        }
    }
    if (40 == e.keyCode) { // move down
        yActive = (yActive < dataCount - 1) ? yActive + 1 : yActive;
    }

    if (switchCategory) {
        generateTableByMatchKeyData();
    }
}

/**
 * 根據有效定位上色
 */
function rePosition() {
    $('.active').removeClass('active');
    $('#dictionaryData tr td').eq(yActive * 2).addClass('active');
    $('#dictionaryData tr td').eq(yActive * 2 + 1).addClass('active');
    $('#dictionaryMain tr th').eq(xActive).addClass('active');
    let calcTop = $('#dictionaryCategory')[0].offsetHeight + yActive * ($('#dictionaryData')[0].offsetHeight / $('#dictionaryData tr').length);
    if (calcTop - 255 > 0) {
        $('#dictionaryMain')[0].scrollTop = calcTop - 255;
    } else {
        $('#dictionaryMain')[0].scrollTop = 0;
    }
}
