var isDispTableBtn = false;
var rankTable = [];
var rapInfoArray = [];
var maxRank = 0;
var lastExp = 0;
var lastExpDiff = 0;
var lapTypeCount = 0;
var explist = [15000, 10000, 9900, 9800];
var baseExp = 0;
var lapInfoList = [];
const WAKUWAKU_MANABI = 1.6;
const MIN_MONTH = 1;
const MAX_MONTH = 12;
const MIN_DAY = 1;
const MAX_DAY = 31;
const TARGET_YEAR = 'target_year';
const ID_TARGET_YEAR = '#' + TARGET_YEAR;
const TARGET_MONTH = 'target_month';
const ID_TARGET_MONTH = '#' + TARGET_MONTH;
const TARGET_DAY = 'target_day';
const ID_TARGET_DAY = '#' + TARGET_DAY;
const TARGET_RANK = 'target_rank';
const ID_TARGET_RANK = '#' + TARGET_RANK;
const TOTAL_EXP = 'total_exp';
const ID_TOTAL_EXP = '#' + TOTAL_EXP;
const DAYS_LEFT = 'days_left';
const ID_DAYS_LEFT = '#' + DAYS_LEFT;
const LAP_COUNT_TBODY = 'lap_count_tbody';
const ID_LAP_COUNT_TBODY = '#' + LAP_COUNT_TBODY;
const NEED_EXP = 'need_exp';
const ID_NEED_EXP = '#' + NEED_EXP;
const DAYS_EXP = 'days_exp';
const ID_DAYS_EXP = '#' + DAYS_EXP;
const TARGET_EXP = 'target_exp';
const ID_TARGET_EXP = '#' + TARGET_EXP;
const OVER_RANK_MSG = 'over_rank_msg';
const ID_OVER_RANK_MSG = '#' + OVER_RANK_MSG;
const NOW_RANK = 'now_rank';
const ID_NOW_RANK = '#' + NOW_RANK;
const DIFFICULTY = 'difficulty';
const ID_DIFFICULTY = '#' + DIFFICULTY;

/**
 * ページ読み込み時
 */
$(document).ready(function() {
    var d = new $.Deferred();

    // 難易度プルダウン設定
    $(ID_DIFFICULTY).append($('<option>').html("新").val(0));
    $(ID_DIFFICULTY).append($('<option>').html("上").val(1));
    $(ID_DIFFICULTY).append($('<option>').html("中").val(2));
    $(ID_DIFFICULTY).append($('<option>').html("下").val(3));
    setInitVal(DIFFICULTY);
    var exp = explist[Number($(ID_DIFFICULTY).val())];
    baseExp = Number(WAKUWAKU_MANABI * exp);
    $('#base_exp_label').text("の経験値は" + addFigure(exp) + " x 1.6(学び特L)");

    async(function() {
        loadRankTableCsv();
        d.resolve();
    });

    d.promise()
        .then(function() {
            var d2 = new $.Deferred();
            async(function() {
                loadLapInfoCsv();
                d2.resolve();
            });
            return d2.promise();
        })
        .then(function() {
            // 目標ランク初期選択
            // $(ID_TARGET_RANK).val(1);

            // Cookieから前回入力時の値を取得
            // 目標ランク
            setInitVal(TARGET_RANK);
            $(ID_TARGET_EXP).text(addFigure(calcRankToExp(ID_TARGET_RANK)));

            // 目標年プルダウン設定
            var today = new Date();
            createNumPulldownOption(TARGET_YEAR, today.getFullYear(), today.getFullYear() + 10);
            // 目標月プルダウン設定
            createNumPulldownOption(TARGET_MONTH, MIN_MONTH, MAX_MONTH);
            // 目標月プルダウン設定
            createNumPulldownOption(TARGET_DAY, MIN_DAY, MAX_DAY);

            // 現在のランク
            setInitVal(NOW_RANK);
            // 累計経験値
            setInitVal(TOTAL_EXP, true);
            // 目標年
            setInitVal(TARGET_YEAR, false, today.getFullYear());
            // 目標月
            setInitVal(TARGET_MONTH, false, today.getMonth() + 1);
            // 目標日
            changeDay();
            setInitVal(TARGET_DAY, false, today.getDate());

            // 算出
            calcAll();

            $(ID_OVER_RANK_MSG).text('ランク:' + (maxRank + 1) + '以降は経験値:' + addFigure(lastExpDiff) + '毎に加算した目安です。');

            // ツイートボタン生成
            setTweetButton();
        });
});

function async(f) {
    setTimeout(f, 500);
}

/**
 * 目標ランク変更イベント
 */
function changeTargetRank() {
    setCookieVal(TARGET_RANK);
    // 算出
    $(ID_TARGET_EXP).text(addFigure(calcRankToExp(ID_TARGET_RANK)));
    calcAll();
    // ツイートボタン生成
    setTweetButton();
}

/**
 * 現在のランク変更イベント
 */
function changeNowRank() {
    // 算出
    $(ID_TOTAL_EXP).val(addFigure(calcRankToExp(ID_NOW_RANK)));
    calcAll();
    setCookieVal(NOW_RANK);
    setCookieVal(TOTAL_EXP, true);
    // ツイートボタン生成
    setTweetButton();
}

/**
 * 累計経験値変更イベント
 */
function changeTotalExp() {
    var totalExp = delFigure($(ID_TOTAL_EXP).val());
    // カンマ設定
    $(ID_TOTAL_EXP).val(addFigure(totalExp));
    // 現在のランク算出
    calcNowRank();
    // 算出
    calcAll();
    setCookieVal(NOW_RANK);
    setCookieVal(TOTAL_EXP, true);
    // ツイートボタン生成
    setTweetButton();
}

/**
 * 累計経験値フォーカスインイベント
 */
function focusTotalExp() {
    // カンマ外し
    $(ID_TOTAL_EXP).val(delFigure($(ID_TOTAL_EXP).val()));
}

/**
 * 累計経験値フォーカスアウトイベント
 */
function blurTotalExp() {
    // カンマ設定
    $(ID_TOTAL_EXP).val(addFigure($(ID_TOTAL_EXP).val()));
}

/**
 * 目標年変更イベント
 */
 function changeTargetYear() {
    convertNum(TARGET_YEAR);
    setCookieVal(TARGET_YEAR);
    changeDay();
    calcAll();
    // ツイートボタン生成
    setTweetButton();
}

/**
 * 目標月変更イベント
 */
function changeTargetMonth() {
    convertNum(TARGET_MONTH);
    setCookieVal(TARGET_MONTH);
    changeDay();
    calcAll();
    // ツイートボタン生成
    setTweetButton();
}

/**
 * 目標日変更イベント
 */
function changeTargetDay() {
    convertNum(TARGET_DAY);
    setCookieVal(TARGET_DAY);
    calcAll();
    // ツイートボタン生成
    setTweetButton();
}

/**
 * 難易度変更イベント
 */
function changeDifficulty() {
    var exp = explist[$(ID_DIFFICULTY).val()];
    setCookieVal(DIFFICULTY);
    $('#base_exp_label').text('の経験値は' + addFigure(exp) + ' x 1.6(学び特L)');
    baseExp = Number(WAKUWAKU_MANABI * exp);
    makeLapCount();
    calcAll();
}

/**
 * 数値変換
 */
function convertNum(id) {
    var val = $('#' + id).val();
    if (val) {
        val = Number(val);
        if (!isNaN(val)) {
            $('#' + id).val(val);
        }
    }
}

/**
 * 残り日数算出
 */
function calcDaysLeft() {
    var y = $(ID_TARGET_YEAR).val();
    var m = $(ID_TARGET_MONTH).val();
    var d = $(ID_TARGET_DAY).val();
    if (!y || !m || !d) {
        return;
    }
    var targetYMD = new Date(y, m - 1, d);
    var today = new Date();
    today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    var daysLeft = (targetYMD - today) / 86400000;
    if (daysLeft < 0) {
        daysLeft = '';
    } else {
        daysLeft++;
    }
    $(ID_DAYS_LEFT).text(daysLeft);
}


/**
* CSV読み込み処理
*/
function loadRankTableCsv() {
    $.get('./data/rank_table.csv', makeArrayList, 'text');
}

/**
* CSVから配列生成
*/
function makeArrayList(data) {
    // 文字列→行単位に変換
    var list = data.split("\n");
    // １行を配列に変換
    for(var i=0;i<list.length;i++){
        rankTable.push(list[i].split(","));
        lastExp = rankTable[i][1];
        if (i > 0) {
            lastExpDiff = lastExp - rankTable[i - 1][1];
        }
        maxRank = i + 1;
    }

    return true;
}

/**
* CSV読み込み処理
*/
function loadLapInfoCsv() {
    $.get('./data/lap_info.csv', makeLapInfoArrayList, 'text');
}

/**
* CSVから配列生成
*/
function makeLapInfoArrayList(data) {
    // 文字列→行単位に変換
    lapInfoList = data.split("\n");
    makeLapCount();
    return true;
}

/**
 * 周回数再表示
 */
function makeLapCount() {
    $(ID_LAP_COUNT_TBODY).empty();
    rapInfoArray = [];

    // １行を配列に変換
    for(var i = 0; i < lapInfoList.length; i++){
        rapInfoArray.push(lapInfoList[i].split(","));
        var expMag = rapInfoArray[i][1];
        expMag = parseFloat(expMag) * baseExp;
        var expMagStr = addFigure(expMag);
        var needExp = $(ID_NEED_EXP).text();

        if (!needExp) {
            expMag = '';
        }

        // 必要経験値カンマ外し
        needExp = delFigure(needExp);

        var rowStr = '';
        rowStr += '<tr>';
        // 周回方法
        rowStr += '<td id="lap_type' + i +'">' + rapInfoArray[i][0] + '</td>';
        // 1周経験値
        rowStr += '<td id="lap_exp'+ i +'">' + expMagStr + '</td>';
        // 1日分
        rowStr += '<td id="lap_one_day' + i + '"></td>';
        // 目標まで
        rowStr += '<td id="lap_goal' + i + '"></td>';
        // 1日分(h)
        rowStr += '<td id="lap_one_day_h' + i + '"></td>';
        // 目標まで(h)
        rowStr += '<td id="lap_goal_h' + i + '"></td>';
        rowStr += '</tr>';
        $(ID_LAP_COUNT_TBODY).append(rowStr);

        lapTypeCount++;
    }
}

/**
 * 数値の3桁カンマ区切り
 * 入力値をカンマ区切りにして返却
 * [引数]   numVal: 入力数値
 * [返却値] String(): カンマ区切りされた文字列
 */
 function addFigure(numVal) {
    // 空の場合そのまま返却
    if (!numVal){
      return numVal;
    }
    numVal = numVal.toString();
    // 全角から半角へ変換し、既にカンマが入力されていたら事前に削除
    numVal = toHalfWidth(numVal).replace(/,/g, "").trim();
    // 数値でなければそのまま返却
    if ( !/^[+|-]?(\d*)(\.\d+)?$/.test(numVal) ){
        return numVal;
　　}
    // 整数部分と小数部分に分割
    var numData = numVal.toString().split('.');
    // 整数部分を3桁カンマ区切りへ
    numData[0] = Number(numData[0]).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    // 小数部分と結合して返却
    return numData.join('.');
}

/**
 * カンマ外し
 * 入力値のカンマを取り除いて返却
 */
function delFigure(strVal){
    if (!strVal) {
        return strVal;
    }
    return strVal.replace( /,/g , "" );
}

/**
 * 全角から半角への変革関数
 * 入力値の英数記号を半角変換して返却
 */
function toHalfWidth(strVal){
    // 半角変換
    var halfVal = strVal.replace(/[！-～]/g,
        function( tmpStr ) {
            // 文字コードをシフト
            return String.fromCharCode( tmpStr.charCodeAt(0) - 0xFEE0 );
        }
    );
    return halfVal;
}

/**
 * 現在のランク計算
 */
function calcNowRank() {
    var totalExp = Number(delFigure($(ID_TOTAL_EXP).val()));
    var nowRank = '';
    lastExp = Number(lastExp);
    if (totalExp > lastExp) {
        // 累計が最高ランクの経験値を超えている場合
        var i = 0;
        while (1) {
            i++;
            if (totalExp < (Number(lastExpDiff) * i) + lastExp) {
                break;
            }
        }
        nowRank = maxRank + i - 1;
    } else {
        var i = maxRank - 1; // 添え字のため-1
        while (i > 0) {
            if (Number(rankTable[i][1]) <= totalExp) {
                nowRank = i + 1; // +1してランクに戻す
                break;
            }
            i--;
        }
    }
    $(ID_NOW_RANK).val(nowRank);
}

/**
 * 全体計算
 */
function calcAll() {
    calcDaysLeft();
    calcExp();
    calcLapCount();
}

/**
 * ランクに応じた経験値を算出
 */
function calcRankToExp(rankId) {
    var targetRank = $(rankId).val();
    var targetExp = 0;
    // カンマ除去
    targetRank = delFigure(targetRank);

    if (!targetRank) {
        targetExp = '';
    } else if (targetRank <= maxRank) {
        // 目標ランクが最大ランク以内の場合、目標経験値を配列から取得
        targetExp = rankTable[targetRank - 1][1];
    } else if (targetRank > maxRank) {
        // 目標ランクが最大ランクを超えている場合
        // ((目標ランク - 最終ランク) * 最終ランク経験値差分) + 最終ランク経験値
        targetExp = ((targetRank - maxRank) * Number(lastExpDiff)) + Number(lastExp);
    }

    return targetExp;
}

/**
 * 必要経験値・1日目標経験値算出
 */
function calcExp() {
    var targetExp = delFigure($(ID_TARGET_EXP).text());
    var totalExp = delFigure($(ID_TOTAL_EXP).val());
    var daysLeft = $(ID_DAYS_LEFT).text();

    if (!targetExp || !totalExp || !daysLeft) {
        $(ID_NEED_EXP).text('');
        $(ID_DAYS_EXP).text('');
        return;
    }

    var needExp = targetExp - totalExp;
    var daysExp = 0;

    if (needExp <= 0) {
        $(ID_NEED_EXP).text('');
        $(ID_DAYS_EXP).text('');
        return;
    }

    if (daysLeft > 0) {
        daysExp = Math.ceil(needExp / daysLeft);
    }
    $(ID_NEED_EXP).text(addFigure(needExp));
    $(ID_DAYS_EXP).text(addFigure(daysExp));
}

/**
 * 周回数算出
 */
function calcLapCount() {
    // 必要経験値
    var needExp = $(ID_NEED_EXP).text();
    // 1日目標経験値
    var daysExp = $(ID_DAYS_EXP).text();
    if (!needExp || !daysExp) {
        loadLapInfoCsv();
        return;
    }

    // 必要経験値カンマ外し
    needExp = Number(delFigure(needExp));
    // 1日目標経験値カンマ外し
    daysExp = Number(delFigure(daysExp));

    for(var i = 0; i < lapTypeCount; i++){
        // 1周経験値
        var lapExp = $('#lap_exp' + i).text();
        lapExp = Number(delFigure(lapExp));
        // 目標まで
        var lapGoal = Math.ceil(needExp / lapExp);
        $('#lap_goal' + i).text(addFigure(lapGoal));
        // 1日分
        var lapOneDay = Math.ceil(daysExp / lapExp);
        $('#lap_one_day' + i).text(addFigure(lapOneDay));
        // 目標まで(h)
        var lapGoalH = Math.ceil(lapGoal * 10 / 50) / 10;
        lapGoalH = lapGoalH.toFixed(1);
        lapGoalH = addFigure(lapGoalH);
        $('#lap_goal_h' + i).text(lapGoalH);
        // 1日分(h)
        var lapOneDayH = Math.ceil(lapOneDay * 10 / 50) / 10;
        lapOneDayH = lapOneDayH.toFixed(1);
        lapOneDayH = addFigure(lapOneDayH);
        $('#lap_one_day_h' + i).text(lapOneDayH);
    }
}

// 目標月日プルダウン選択項目変更
function changeDay() {
    var targetYear = $(ID_TARGET_YEAR).val();
    var targetMonth = $(ID_TARGET_MONTH).val();
    var targetDay = $(ID_TARGET_DAY).val();
    var lastDate = new Date(targetYear, targetMonth, 0);

    $(ID_TARGET_DAY + ' option').remove();
    for (var i = 1; i <= lastDate.getDate(); i++) {
        $(ID_TARGET_DAY).append($('<option>').html(i).val(i));
    }
    if (targetDay > lastDate.getDate()) {
        targetDay = lastDate.getDate();
    }
    $(ID_TARGET_DAY).val(targetDay);
}

/**
 * クッキーに値を設定
 */
function setCookieVal(id, isDelFigure = false) {
    // 画面入力値取得
    var value = $('#' + id).val();
    if (isDelFigure) {
        // カンマを外す
        value = delFigure(value);
    }
    Cookies.set(id, value);
}

/**
 * 数値プルダウン選択肢作成
 */
function createNumPulldownOption(id, from, to) {
    // リストクリア
    $('#' + id).empty();

    // 選択肢作成
    for (var i = from; i <= to; i++) {
        $('#' + id).append($('<option>').html(i).val(i));
    }
}

/**
 * 初期値設定
 */
function setInitVal(id, isAddFigure = false, undefinedVal = '') {
    var val = Cookies.get(id);
    if (val) {
        if (isAddFigure) {
            val = addFigure(val);
        }
        $('#' + id).val(val);
    } else {
        if (undefinedVal) {
            $('#' + id).val(undefinedVal);
        }
    }
}

/**
 * ツイートボタン生成
 */
function setTweetButton(){
    $('#tweet_area').empty(); //既存のボタン消す
    $('#share').hide();
    var targetRank = $(ID_TARGET_RANK).val();
    var nowRank = $(ID_NOW_RANK).val();

    if (!targetRank || !nowRank || !$(ID_NEED_EXP).text()) {
        return;
    }

    var text = '';
    text += '【目標ランク】' + targetRank;
    if (targetRank > maxRank) {
        text += '(推定)';
    }
    text += '\n';
    text += '【現在のランク】' + nowRank;
    if (nowRank > maxRank) {
        text += '(推定)';
    }
    text += '\n';
    text += '【目標日】' + $(ID_TARGET_YEAR).val() + '年' + $(ID_TARGET_MONTH).val() + '月' + $(ID_TARGET_DAY).val() + '日' + '\n';
    text += '目標までに必要な経験値は ' + $(ID_NEED_EXP).text() + '\n';
    text += '毎日 ' + $(ID_DAYS_EXP).text() + ' 獲得すれば達成可能！';

    // ボタン生成
    $('#share').show();
    twttr.widgets.createShareButton(
      "",
      document.getElementById("tweet_area"),
      {
        text: text, // 狙ったテキスト
        url: 'https://ishikoro1994.github.io/monsuto_rank_tool/',
        hashtags: 'モンスト,モンスト目標宣言,ノマクエ周回',
        lang: 'ja'
      }
    );
}
