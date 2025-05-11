var isDispTableBtn = false;
var rankTable = [];
var rapInfoArray = [];
var maxRank = 0;
var lastExp = 0;
var lastExpDiff = 0;
var lapTypeCount = 0;
var explist = [40000, 20000, 15000, 10000];
var baseExp = 0;
var lapInfoList = [];
var unkyokubonusList =
    [
        { 'label': 'なし', 'mag': 1.0},
        { 'label': 'Lv1', 'mag': 1.01},
        { 'label': 'Lv2', 'mag': 1.02},
        { 'label': 'Lv3', 'mag': 1.03},
        { 'label': 'Lv4', 'mag': 1.04},
        { 'label': 'Lv5', 'mag': 1.05}
    ]
const WAKUWAKU_MANABI = 1.6;
const WAKUWAKU_MANABI_EL = 1.65;
const MIN_MONTH = 1;
const MAX_MONTH = 12;
const MIN_DAY = 1;
const MAX_DAY = 31;
const EXP_ABILITY_BASE_TXT = '(経験値アビ)';

/**
 * ページ読み込み時
 */
$(document).ready(function() {
    // URLパラメータを取得
    const urlParams = new URLSearchParams(window.location.search);
    const targetRankParam = urlParams.get('target_rank');
    const nowRankParam = urlParams.get('now_rank');
    const totalExpParam = urlParams.get('total_exp');
    const targetYearParam = urlParams.get('target_year');
    const targetMonthParam = urlParams.get('target_month');
    const targetDayParam = urlParams.get('target_day');

    // --- 同期的な初期設定 ---
    // 運極ボーナスプルダウン
    unkyokubonusList.forEach((e) => {
        $('#unkyoku_bonus').append($('<option>').html(e.label).val(e.mag));
    });
    $('#unkyoku_bonus').val(unkyokubonusList[unkyokubonusList.length - 1].mag); // デフォルトを最大に

    // 1時間当たりの周回数
    $('#hour_lap').val(40); // デフォルト値

    // 難易度プルダウン設定
    $('#difficulty').append($('<option>').html("危地").val(0));
    $('#difficulty').append($('<option>').html("魔境").val(1));
    $('#difficulty').append($('<option>').html("険所").val(2));
    $('#difficulty').append($('<option>').html("魔殿").val(3));
    $('#difficulty').val(0); // デフォルト値を設定 (例: 危地)


    // --- 非同期処理 (CSV読み込み) ---
    const d1_rankTable = $.get('./data/rank_table.csv', 'text').done(makeArrayList);
    const d2_lapInfo = $.get('./data/lap_info.csv', 'text').done(makeLapInfoArrayList); // makeLapInfoArrayListの中でmakeLapCountが呼ばれる
    const d3_zeLe = $.Deferred();
    loadZeLeCsvModified(d3_zeLe); // この中で ze-le プルダウン設定, changeDetail(), d3_zeLe.resolve()


    // --- 全ての非同期処理完了後 ---
    $.when(d1_rankTable, d2_lapInfo, d3_zeLe).done(function() {
        // 目標ランクのURLパラメータ処理とデフォルト値設定
        if (targetRankParam) {
            $('#target_rank').val(targetRankParam);
        } else {
            $('#target_rank').val(1500); // デフォルト目標ランク
        }
        // target_exp は target_rank の値に基づいて計算
        $('#target_exp').text(addFigure(calcRankToExp('#target_rank')));

        // 目標年月日のプルダウン生成とURLパラメータ/デフォルト値処理
        var today = new Date();
        createNumPulldownOption('target_year', today.getFullYear(), today.getFullYear() + 10);
        createNumPulldownOption('target_month', MIN_MONTH, MAX_MONTH);
        createNumPulldownOption('target_day', MIN_DAY, MAX_DAY); // 初期は1-31の選択肢

        // 年の設定
        if (targetYearParam) {
            $('#target_year').val(targetYearParam);
        } else {
            $('#target_year').val(today.getFullYear());
        }
        // 月の設定
        if (targetMonthParam) {
            $('#target_month').val(targetMonthParam);
        } else {
            $('#target_month').val(today.getMonth() + 1);
        }
        
        changeDay(); // 年月に基づいて日の選択肢を更新し、現在の選択値を調整

        // 日の設定 (changeDayの後にURLパラメータまたはデフォルト値を設定)
        if (targetDayParam) {
            // URLパラメータの日付が存在し、かつ現在の月の選択肢にあれば設定
            if ($('#target_day option[value="' + targetDayParam + '"]').length > 0) {
                $('#target_day').val(targetDayParam);
            }
            // 選択肢にない場合(例: 2月30日など)は、changeDay()で調整された日付のまま
        } else {
            // URLパラメータがない場合、changeDay()で調整された今日の日付、または月の最終日が設定される
            // changeDay内部で $('#target_day').val(targetDay); を呼んでいるので、
            // today.getDate() が妥当ならそれが、そうでなければ調整された日が設定される。
            // ここでは、changeDayが設定したデフォルトのままとする。
            // もし今日の日付を確実に設定したい場合は、再度妥当性チェックの上で $('#target_day').val(today.getDate()) とする。
            // ただし、changeDayが既に良い感じにしているので、ここでは何もしない。
        }

        // 現在ランク・累計経験値のURLパラメータ処理とデフォルト値設定
        if (totalExpParam) {
            $('#total_exp').val(addFigure(totalExpParam));
            calcNowRank(); // total_expからnow_rankを計算
        } else if (nowRankParam) {
            $('#now_rank').val(nowRankParam);
            $('#total_exp').val(addFigure(calcRankToExp('#now_rank')));
        } else {
            // URLパラメータがない場合のデフォルト値
            $('#now_rank').val(1); // デフォルト現在ランク
            $('#total_exp').val(addFigure(calcRankToExp('#now_rank')));
        }
        
        calcAll(); // 全ての入力値が確定した後に最終計算

        $('#over_rank_msg').text('ランク:' + (maxRank + 1) + '以降は経験値:' + addFigure(lastExpDiff) + '毎に加算した目安です。');
        setTweetButton();
    });
});

/**
 * 目標ランク変更イベント
 */
function changeTargetRank() {
    // 算出
    $('#target_exp').text(addFigure(calcRankToExp('#target_rank')));
    calcAll();
    // ツイートボタン生成
    setTweetButton();
}

/**
 * 現在のランク変更イベント
 */
function changeNowRank() {
    // 算出
    $('#total_exp').val(addFigure(calcRankToExp('#now_rank')));
    calcAll();
    // ツイートボタン生成
    setTweetButton();
}

/**
 * 累計経験値変更イベント
 */
function changeTotalExp() {
    var totalExp = delFigure($('#total_exp').val());
    // カンマ設定
    $('#total_exp').val(addFigure(totalExp));
    // 現在のランク算出
    calcNowRank();
    // 算出
    calcAll();
    // ツイートボタン生成
    setTweetButton();
}

/**
 * 累計経験値フォーカスインイベント
 */
function focusTotalExp() {
    // カンマ外し
    $('#total_exp').val(delFigure($('#total_exp').val()));
}

/**
 * 累計経験値フォーカスアウトイベント
 */
function blurTotalExp() {
    // カンマ設定
    $('#total_exp').val(addFigure($('#total_exp').val()));
}

/**
 * 目標年変更イベント
 */
 function changeTargetYear() {
    convertNum('target_year');
    changeDay();
    calcAll();
    // ツイートボタン生成
    setTweetButton();
}

/**
 * 目標月変更イベント
 */
function changeTargetMonth() {
    convertNum('target_month');
    changeDay();
    calcAll();
    // ツイートボタン生成
    setTweetButton();
}

/**
 * 目標日変更イベント
 */
function changeTargetDay() {
    convertNum('target_day');
    calcAll();
    // ツイートボタン生成
    setTweetButton();
}

/**
 * 難易度変更イベント
 */
function changeDifficulty() {
    changeDetail();
}

/**
 * 運極ボーナス変更イベント
 */
function changeUnkyokubonus() {
    changeDetail();
}

/**
 * 学びELチェック
 */
function changeElCheck(){
    changeDetail();
}

/**
 * マルチチェック
 */
function changeMultiCheck() {
    changeDetail();
}

/**
 * 経験値アップアビリティチェック
 */
function changeExpAbilityCheck() {
    // チェック状態に応じてゼーレプルダウンの有効無効を切り替え
    if ($('#exp_ability_check').prop('checked')) {
        $('#ze-le').prop('disabled', false); // 有効化
    } else {
        $('#ze-le').prop('disabled', true); // 無効化
    }
    changeDetail();
}

/**
 * ゼーレプルダウン変更イベント
 */
function changeZele() {
    // const zeLeSelect = $('#ze-le');
    // const zeLeWarning = $('#ze-le-warning');
    // const lastOptionValue = parseFloat($('#ze-le option:last').val());
    // const selectedValue = parseFloat(zeLeSelect.val());

    // // 最終行が選択されている場合は注意書きを非表示、それ以外は表示
    // if (selectedValue === lastOptionValue) {
    //     zeLeWarning.hide();
    // } else {
    //     zeLeWarning.show();
    // }

    // 必要に応じて他の処理を呼び出す
    changeDetail();
}

/**
 * 1時間あたりの周回数変更イベント
 */
function changeHourlap() {
    changeDetail();
}

function changeDetail() {
    let exp = explist[$('#difficulty').val()];
    let wakuwaku = WAKUWAKU_MANABI;
    let wakuwakuLabel = ' x 1.6(学び特L)';
    if ($('#el_check').prop("checked")) {
        wakuwaku = WAKUWAKU_MANABI_EL;
        wakuwakuLabel = ' x 1.65(学び特EL)';
    }

    let bonus = $('#unkyoku_bonus').val();
    // マルチのチェック状態によって経験値倍率変更
    let multiExpMag = 1.0;
    let multiTxt = '';
    if ($('#multi_check')[0].checked) {
        multiExpMag = 1.05;
        multiTxt = ' x ' + multiExpMag + '(マルチ)';
    }

    // 経験値アップアビリティ
    let expAbility = parseFloat($('#ze-le').val()); // ze-leの値を取得
    let expAbilityTxt = '';
    let expAbilityMag = 1.0;

    if ($('#exp_ability_check')[0].checked) {
        expAbilityMag = expAbility;

        // 最終行の値を取得
        let lastOptionValue = parseFloat($('#ze-le option:last').val());

        // 表記上の処理
        if (expAbilityMag === lastOptionValue) { // 最終行が選ばれている場合
            expAbilityTxt = ' x ' + expAbilityMag + EXP_ABILITY_BASE_TXT; // 小数点第3位まで表示
        } else {
            expAbilityTxt = ' x 約1.' + (Math.round((expAbilityMag - 1) * 1000)).toString().padStart(3, '0') + EXP_ABILITY_BASE_TXT;
        }
    }

    // 基本経験値の計算
    baseExp = Number(wakuwaku * multiExpMag * bonus * exp * expAbilityMag);

    // 表示の更新
    $('#base_exp_label').text(
        '1周経験値:' + addFigure(exp)
        + ' x ' + Number(bonus).toFixed(2) + '(運極ボーナス)'
        + wakuwakuLabel
        + multiTxt
        + expAbilityTxt
    );

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
    var y = $('#target_year').val();
    var m = $('#target_month').val();
    var d = $('#target_day').val();
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
    $('#days_left').text(daysLeft);
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
 * ze-le.csv読み込み処理 (Deferred対応版)
 */
function loadZeLeCsvModified(deferred) {
    $.get('./data/ze-le.csv', function(data) {
        var rows = data.split("\n");
        var lastRow = null;
        $('#ze-le option').remove(); // プルダウンの選択肢をクリア
        rows.forEach(function(row, index) {
            var cols = row.split(",");
            if (cols.length >= 2) {
                $('#ze-le').append($('<option>').html(cols[0]).val(cols[1]));
                lastRow = cols; // 最終行を保存
            }
        });

        // 最終行を初期値として設定
        if (lastRow) {
            $('#ze-le').val(lastRow[1]); // 最終行の値を選択
        }
        changeDetail(); // ze-leの値が設定された後、関連計算(baseExpなど)を更新
        deferred.resolve(); // Deferredを解決
    }, 'text');
}

/**
 * 周回数再表示
 */
function makeLapCount() {
    $('#lap_count_tbody').empty();
    rapInfoArray = [];

    // １行を配列に変換
    for(var i = 0; i < lapInfoList.length; i++){
        rapInfoArray.push(lapInfoList[i].split(","));
        var expMag = rapInfoArray[i][1];
        expMag = Math.ceil(parseFloat(expMag) * baseExp);
        var expMagStr = addFigure(expMag);
        var needExp = $('#need_exp').text();

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
        $('#lap_count_tbody').append(rowStr);

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
    var totalExp = Number(delFigure($('#total_exp').val()));
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
    $('#now_rank').val(nowRank);
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
    var targetExp = delFigure($('#target_exp').text());
    var totalExp = delFigure($('#total_exp').val());
    var daysLeft = $('#days_left').text();

    if (!targetExp || !totalExp || !daysLeft) {
        $('#need_exp').text('');
        $('#days_exp').text('');
        return;
    }

    var needExp = targetExp - totalExp;
    var daysExp = 0;

    if (needExp <= 0) {
        $('#need_exp').text('');
        $('#days_exp').text('');
        return;
    }

    if (daysLeft > 0) {
        daysExp = Math.ceil(needExp / daysLeft);
    }
    $('#need_exp').text(addFigure(needExp));
    $('#days_exp').text(addFigure(daysExp));
}

/**
 * 周回数算出
 */
function calcLapCount() {
    // 必要経験値
    var needExp = $('#need_exp').text();
    // 1日目標経験値
    var daysExp = $('#days_exp').text();
    if (!needExp || !daysExp) {
        loadLapInfoCsv();
        return;
    }

    var hourLap = $('#hour_lap').val();
    hourLap = Number(hourLap);

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
        var lapGoalH = Math.ceil(lapGoal * 10 / hourLap) / 10;
        lapGoalH = lapGoalH.toFixed(1);
        lapGoalH = addFigure(lapGoalH);
        $('#lap_goal_h' + i).text(lapGoalH);
        // 1日分(h)
        var lapOneDayH = Math.ceil(lapOneDay * 10 / hourLap) / 10;
        lapOneDayH = lapOneDayH.toFixed(1);
        lapOneDayH = addFigure(lapOneDayH);
        $('#lap_one_day_h' + i).text(lapOneDayH);
        // 1日分(h)の表示
    }
}

// 目標月日プルダウン選択項目変更
function changeDay() {
    var targetYear = $('#target_year').val();
    var targetMonth = $('#target_month').val();
    var targetDay = $('#target_day').val();
    var lastDate = new Date(targetYear, targetMonth, 0);

    $('#target_day' + ' option').remove();
    for (var i = 1; i <= lastDate.getDate(); i++) {
        $('#target_day').append($('<option>').html(i).val(i));
    }
    if (targetDay > lastDate.getDate()) {
        targetDay = lastDate.getDate();
    }
    $('#target_day').val(targetDay);
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
    if (undefinedVal) {
        $('#' + id).val(undefinedVal);
    }
}

/**
 * ツイートボタン生成
 */
function setTweetButton(){
    $('#tweet_area').empty(); //既存のボタン消す
    $('#share').hide();
    var targetRank = $('#target_rank').val();
    var nowRank = $('#now_rank').val();

    if (!targetRank || !nowRank || !$('#need_exp').text()) {
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
    text += '【目標日】' + $('#target_year').val() + '年' + $('#target_month').val() + '月' + $('#target_day').val() + '日' + '\n';
    text += '目標までに必要な経験値は ' + $('#need_exp').text() + '\n';
    text += '毎日 ' + $('#days_exp').text() + ' 獲得すれば達成可能！';

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
