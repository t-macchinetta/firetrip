$(function () {
    // PWA
    'use strict';
    var isLocalhost = Boolean(window.location.hostname === 'localhost' ||
        // [::1] is the IPv6 localhost address.
        window.location.hostname === '[::1]' ||
        // 127.0.0.1/8 is considered localhost for IPv4.
        window.location.hostname.match(
            /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
        )
    );

    if ('serviceWorker' in navigator &&
        (window.location.protocol === 'https:' || isLocalhost)) {
        navigator.serviceWorker.register('service-worker.js')
            .then(function (registration) {
                // updatefound is fired if service-worker.js changes.
                registration.onupdatefound = function () {
                    // updatefound is also fired the very first time the SW is installed,
                    // and there's no need to prompt for a reload at that point.
                    // So check here to see if the page is already controlled,
                    // i.e. whether there's an existing service worker.
                    if (navigator.serviceWorker.controller) {
                        // The updatefound event implies that registration.installing is set:
                        // https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-container-updatefound-event
                        var installingWorker = registration.installing;

                        installingWorker.onstatechange = function () {
                            switch (installingWorker.state) {
                                case 'installed':
                                    // At this point, the old content will have been purged and the
                                    // fresh content will have been added to the cache.
                                    // It's the perfect time to display a "New content is
                                    // available; please refresh." message in the page's interface.
                                    break;

                                case 'redundant':
                                    throw new Error('The installing ' +
                                        'service worker became redundant.');

                                default:
                                // Ignore
                            }
                        };
                    }
                };
            }).catch(function (e) {
                console.error('Error during service worker registration:', e);
            });
    }
    // !PWA
    // Your custom JavaScript departes here
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyBTCqhpQN1syp9xGKdhMboAn6bdnp8VFgE",
        authDomain: "firejourney-5e61e.firebaseapp.com",
        databaseURL: "https://firejourney-5e61e.firebaseio.com",
        projectId: "firejourney-5e61e",
        storageBucket: "",
        messagingSenderId: "969349459477"
    };
    firebase.initializeApp(config);

    //リアルタイム通信の準備
    var newPostRef = firebase.database().ref();
    var titleRef = firebase.database().ref('/titles');
    var recordsRef = firebase.database().ref('/records');
    // 概要と詳細の状態判定用
    var showStatus = 0;
    // 表示用のID格納
    var show_id;
    var records_no = 0;
    // 順番用の配列
    var recordsNo = [];
    // firebase読み込み用
    var query;
    // 編集判別要変数
    var editStatus = 0;

    // ランダム文字列生成用関数
    function getUniqueStr(myStrong) {
        var strong = 10;
        if (myStrong) strong = myStrong;
        return new Date().getTime().toString(16) + Math.floor(strong * Math.random()).toString(16)
    }

    // 日付設定用関数
    function addDate() {
        var today = new Date();
        today.setDate(today.getDate());
        var yyyy = today.getFullYear();
        var mm = ("0" + (today.getMonth() + 1)).slice(-2);
        var dd = ("0" + today.getDate()).slice(-2);
        $('#depart').val(yyyy + '-' + mm + '-' + dd);
        $('#arrive').val(yyyy + '-' + mm + '-' + dd);
    }

    // 時間を設定する関数
    function addTime() {
        var today = new Date();
        today.setDate(today.getDate());
        // var yyyy = today.getFullYear();
        var hh = ("0" + (today.getHours())).slice(-2);
        var mm = ("0" + today.getMinutes()).slice(-2);
        $('#fromTime').val(hh + ':' + mm);
        $('#toTime').val(hh + ':' + mm);
    }

    // 追加時と編集時にリアルタイムで変更する関数
    function show() {
        if (showStatus == 0) {
            query = titleRef.orderByChild('depart');
        } else {
            query = recordsRef.orderByChild('No');
        }
        query.on('value', function (snapshot) {
            var str = "";
            snapshot.forEach(function (child) {
                // ↓ユニークキー取得
                var k = child.key;
                // ↓データ取得
                var v = child.val();
                // メッセージ表示
                var append_doms;
                if (showStatus == 0) {
                    append_doms = `<div class="card mb-3" id="${k}">
                                        <div class="card-header">
                                            <h5 class="card-title title keyword">${v.title}</h5>
                                            <div class="card-subtitle mb-2 text-muted uid">${v.uid}</div>
                                        </div>
                                        <div class="card-block hidden" id="${v.records}">
                                            <div class="card-text">depart</div>
                                            <div class="card-text depart">${v.depart}</div>
                                            <div class="card-text">arrive</div>
                                            <div class="card-text arrive">${v.arrive}</div>
                                            <div class="card-text">cost</div>
                                            <div class="card-text cost">${v.cost}</div>
                                            <div class="card-text">about</div>
                                            <div class="card-text about keyword">${v.about}</div>
                                            <button type="button" class="btn btn-secondary mt-2 mr-2 show_details">Show Details</button></br>
                                            <button type="button" class="btn btn-secondary mt-2 mr-2 edit disable"><i class="material-icons">edit</i></button>
                                            <button type="button" class="btn btn-secondary mt-2 delete disable"><i class="material-icons">delete</i></button>
                                        </div>
                                    </div>`;
                } else {
                    if (v.uid == show_id) {
                        recordsNo.push(v.No);
                        append_doms = `<div class="card mb-3" id="${k}">
                                            <div class="card-header">
                                                <h5 class="card-title no keyword">${v.No}</h5>
                                                <div class="card-subtitle mb-2 text-muted uid">${v.uid}</div>
                                            </div>
                                            <div class="card-block hidden">
                                                <div class="card-text">fromTime</div>
                                                <div class="card-text fromTime">${v.fromTime}</div>
                                                <div class="card-text">from</div>
                                                <div class="card-text from">${v.from}</div>
                                                <div class="card-text">how</div>
                                                <div class="card-text how">${v.how}</div>
                                                <div class="card-text">toTime</div>
                                                <div class="card-text toTime">${v.toTime}</div>
                                                <div class="card-text">to</div>
                                                <div class="card-text to">${v.to}</div>
                                                <div class="card-text">comment</div>
                                                <div class="card-text comment keyword">${v.comment}</div>
                                                <button type="button" class="btn btn-secondary mt-2 mr-2 edit disable"><i class="material-icons">edit</i></button>
                                                <button type="button" class="btn btn-secondary mt-2 delete disable"><i class="material-icons">delete</i></button>
                                            </div>
                                        </div>`;
                    } else {
                        append_doms = "";
                    }
                }
                str = str + append_doms;
            });
            // ↓表示処理
            // 情報が変更されるたびに更新するのでhtmlにする
            $('#output').html(str);
            // 旅は日付順で並ぶように
            if (showStatus == 0) {
                var $arr = $('.card').sort(function (a, b) {
                    return ($(a).find('.depart').text() < $(b).find('.depart').text() ? 1 : -1);  //ソート条件
                });
                // 変更した並び順で表示
                $('#output').html($arr);
            }
            // alert(recordsNo);
        });
    }

    // 旅とrecordの表示を切り替える関数
    function change(status, target) {
        showStatus = status;
        if (showStatus == 1) {
            // ユニークIDとレコード数を取得
            show_id = $(target).parent().parent().attr("id");
            records_no = $(target).parent().attr("id");
            // sendボタンの挙動
            $('#input').find('.send').prop('disabled', true);
            // 表示
            $('#output').hide().fadeIn(750);
            $('#add_journey').addClass('hidden');
            $('#add_records').removeClass('hidden');
            // show();
        } else {
            // ユニークIDとレコード数を初期化
            show_id = 0;
            records_no = 0;
            // sendボタンの挙動
            $('#input').find('.send').prop('disabled', true);
            // 表示
            $('#output').hide().fadeIn(750);
            $('#add_journey').removeClass('hidden');
            $('#add_records').addClass('hidden');
            // show();
        }
    }



    // 読み込み時にやること
    // 最初の画面表示
    // $('#loading_start').fadeOut(750);
    // $('#loading_end').fadeIn(750);
    // 日付設定
    addDate();
    // 時間設定
    addTime();
    // firebaseデータの読み込み
    show();


    // 以下，データ登録・表示関連

    // データ追加時に日時と時間を合わせる
    $('#add').on('click', function () {
        addDate();
        addTime();
    });

    // 詳細ボタン押下でrecordの表示を切り替え
    $('#output').on('click', '.show_details', function () {
        change(1, this);
        show();
    });
    // トップロゴ押下で旅の表示を切り替え
    $('#back_top').on('click', function () {
        change(0, this);
        show();
    });

    // データ登録時
    // submitでデータ送信
    $('#input').on('click', '.send', function () {
        if (showStatus == 0) {
            // uid用の乱数
            var rand = getUniqueStr(10);
            // 旅追加
            titleRef.push({
                uid: rand,
                records: 0,
                title: $('#title').val(),
                depart: $('#depart').val(),
                arrive: $('#arrive').val(),
                cost: $('#cost').val(),
                about: $('#text').val().split('\n').join('<br>')
            });
            // 入力欄を空白に戻す
            $('#title').val("");
            $('#cost').val("10000");
            $('#text').val("");
        } else if (showStatus == 1) {
            // record追加
            recordsRef.push({
                uid: show_id,
                No: Number(records_no) + 1,
                fromTime: $('#fromTime').val(),
                from: $('#from').val(),
                toTime: $('#toTime').val(),
                to: $('#to').val(),
                how: $('#how').val(),
                comment: $('#r_comment').val().split('\n').join('<br>')
            });
            // 旅のrecord数追加
            var editRef = firebase.database().ref("/titles/" + show_id);
            editRef.update({
                records: Number(records_no) + 1
            });
            // 入力欄を空白に戻す
            $('#from').val("");
            $('#to').val("");
            $('#how').val("");
            $('#r_comment').val("");
        }
        // 送信ボタン無効化
        $('#input').find('.send').prop('disabled', true);
        // モーダル閉じる
        $('body').removeClass('modal-open');
        $('.modal-arrivedrop').remove();
        $('#input').modal('hide');
        show();
    });

    // 必須項目未入力時はsendボタン無効化
    $('#input').on('keyup', '#title, #from, #to, #how', function () {
        if (showStatus == 0) {
            // 旅登録時はタイトル必須
            if ($('#title').val() == "") {
                $('#input').find('.send').prop('disabled', true);
            } else {
                $('#input').find('.send').prop('disabled', false);
            }
        } else if (showStatus == 1) {
            // record登録時は出発地到着地手段必須
            if ($('#from').val() == "" || $('#to').val() == "" || $('#how').val() == "") {
                $('#input').find('.send').prop('disabled', true);
            } else {
                $('#input').find('.send').prop('disabled', false);
            }
        }
    });


    // 編集時にsendボタン無効化
    $('#output').on('keyup', '#title_edit', function () {
        if ($('#title_edit').val() == "") {
            $('.set').prop('disabled', true);
        } else {
            $('.set').prop('disabled', false);
        }
    });

    // 編集ボタンの挙動
    $('#output').on('click', '.edit', function () {
        editStatus = 1;
        var id = $(this).parent().parent().attr("id");
        var title = $('#' + id).find('.title').text();
        var depart = $('#' + id).find('.depart').text();
        var arrive = $('#' + id).find('.arrive').text();
        var cost = $('#' + id).find('.cost').text();
        var about = $('#' + id).find('.about').html();
        var editabout = about.split('<br>').join('\n');
        // 項目を編集できるようにinputに変更する
        $('#' + id).find('.title').html('<input type="text" id="title_edit" class="form-control" value="' + title + '"/>');
        $('#' + id).find('.depart').html('<input type="date" id="depart_edit" class="form-control" value="' + depart + '"/>');
        $('#' + id).find('.arrive').html('<input type="date" id="arrive_edit" class="form-control" value="' + arrive + '"/>');
        if (cost == "10000") {
            $('#' + id).find('.cost').html('<select id="cost_edit" class="form-control"><option value="10000" selected>10000</option><option value="20000">20000</option><option value="30000">30000</option><option value="40000">40000</option><option value="50000">50000</option></select>');
        } else if (cost == "20000") {
            $('#' + id).find('.cost').html('<select id="cost_edit" class="form-control"><option value="10000">10000</option><option value="20000" selected>20000</option><option value="30000">30000</option><option value="40000">40000</option><option value="50000">50000</option></select>');
        } else if (cost == "30000") {
            $('#' + id).find('.cost').html('<select id="cost_edit" class="form-control"><option value="10000">10000</option><option value="20000">20000</option><option value="30000" selected>30000</option><option value="40000">40000</option><option value="50000">50000</option></select>');
        } else if (cost == "40000") {
            $('#' + id).find('.cost').html('<select id="cost_edit" class="form-control"><option value="10000">10000</option><option value="20000">20000</option><option value="30000">30000</option><option value="40000" selected>40000</option><option value="50000">50000</option></select>');
        } else if (cost == "50000") {
            $('#' + id).find('.cost').html('<select id="cost_edit" class="form-control"><option value="10000">10000</option><option value="20000">20000</option><option value="30000">30000</option><option value="40000">40000</option><option value="50000" selected>50000</option></select>');
        }
        $('#' + id).find('.about').html('<textarea rows="3" id="text_edit" class="form-control">' + editabout + '</textarea>');
        // ボタンの文言を変更する(クラスも変更して挙動をいい感じにする)
        $('#' + id).find('.edit').html('<i class="material-icons">arrow_back</i>');
        $('#' + id).find('.edit').addClass("cancel");
        $('#' + id).find('.edit').removeClass("edit");
        // 変更していない部分のボタンは押せないようにする
        $('.edit').prop('disabled', true);
        $('#' + id).find('.delete').html('<i class="material-icons">done</i>');
        $('#' + id).find('.delete').addClass("set");
        $('#' + id).find('.delete').removeClass("delete");
        $('#' + id).find('.set').addClass("btn-primary");
        $('#' + id).find('.set').removeClass("btn-secondary");
        $('.show_details').addClass('hidden');
        $('.delete').prop('disabled', true);
        $('#add').prop('disabled', true);
        $('#send').prop('disabled', true);
        $('#search-text').prop('disabled', true);
        $('input[name="search"]:radio').prop('disabled', true);
        // キャンセル時の挙動
        // inputを登録内容の表示に戻す
        $('#output').on('click', '.cancel', function () {
            $('#' + id).find('.title').html(title);
            $('#' + id).find('.depart').html(depart);
            $('#' + id).find('.arrive').html(arrive);
            $('#' + id).find('.cost').html(cost);
            $('#' + id).find('.about').html(about);
            $('#' + id).find('.cancel').html('<i class="material-icons">edit</i>');
            $('#' + id).find('.cancel').addClass("edit");
            $('#' + id).find('.cancel').removeClass("cancel");
            $('.edit').prop('disabled', false);
            $('#' + id).find('.set').html('<i class="material-icons">delete</i>');
            $('#' + id).find('.set').addClass("delete");
            $('#' + id).find('.set').removeClass("set");
            $('#' + id).find('.delete').addClass("btn-secondary");
            $('#' + id).find('.delete').removeClass("btn-primary");
            $('.show_details').removeClass('hidden');
            $('.delete').prop('disabled', false);
            $('#add').prop('disabled', false);
            // $('#send').prop('disabled', false);
            $('#search-text').prop('disabled', false);
            $('input[name="search"]:radio').prop('disabled', false);
            editStatus = 0;
        });
        // 決定時の挙動
        $('#output').on('click', '.set', function () {
            // 対応するデータを更新する
            // 入力内容を取得
            var id = $(this).parent().parent().attr("id");
            // var username = $('#username_edit').val();
            var title = $('#title_edit').val();
            var depart = $('#depart_edit').val();
            var arrive = $('#arrive_edit').val();
            var cost = $('#cost_edit').val();
            var about = $('#text_edit').val().split('\n').join('<br>');
            // 更新する場所を指定
            var editRef = firebase.database().ref("/titles/" + id);
            // 現在のユニークキー箇所を更新するバージョン
            editRef.update({
                title: title,
                depart: depart,
                arrive: arrive,
                cost: cost,
                about: about
            });
            // input関連を戻す
            $('#' + id).find('.title').html(title);
            $('#' + id).find('.depart').html(depart);
            $('#' + id).find('.arrive').html(arrive);
            $('#' + id).find('.cost').html(cost);
            $('#' + id).find('.about').html(about);
            $('#' + id).find('.cancel').html('<i class="material-icons">edit</i>');
            $('#' + id).find('.cancel').addClass("edit");
            $('#' + id).find('.cancel').removeClass("cancel");
            $('.edit').prop('disabled', false);
            $('#' + id).find('.set').html('<i class="material-icons">delete</i>');
            $('#' + id).find('.set').addClass("delete");
            $('#' + id).find('.set').removeClass("set");
            $('#' + id).find('.delete').addClass("btn-secondary");
            $('#' + id).find('.delete').removeClass("btn-primary");
            $('.delete').prop('disabled', false);
            $('#add').prop('disabled', false);
            $('.show_details').removeClass('hidden');
            $('#search-text').prop('disabled', false);
            $('input[name="search"]:radio').prop('disabled', false);
            editStatus = 0;
        });
    });


    // 削除ボタンの挙動
    $('#output').on('click', '.delete', function () {
        if (!confirm('本当に削除しますか?')) {
            return false;
        } else {
            // 削除時の挙動
            // id(ユニークキー)を取得
            var id = $(this).parent().parent().attr("id");
            // 旅の削除
            titleRef.child(id).remove();
            // 含まれるrecordの削除
            recordsRef.orderByChild('uid').equalTo(id).on('value', function (snapshot) {
                snapshot.forEach(function (child) {
                    recordsRef.child(child.key).remove();
                });
            });
            editStatus = 0;
            show();
        }
    });

    // 検索用の関数
    var searchTitle = function () {
        var searchText = $('#search-text').val(), // 検索ボックスに入力された値
            targetText;
        // 全角スペースを半角スペースに置換
        searchText = searchText.replace(/　/gi, ' ');
        // 半角配列に入れるで区切って配列化
        var searchArr = searchText.split(" ");
        if ($("[name=search]:checked").val() == "title") {
            $('.title').each(function () {
                targetText = $(this).text();
                // 検索対象となるリストに入力された文字列が存在するかどうかを判断
                if (targetText.indexOf(searchText) != -1) {
                    $(this).parent().parent().removeClass('hidden');
                } else {
                    $(this).parent().parent().addClass('hidden');
                }
            });
        } else {
            $('.about').each(function () {
                targetText = $(this).text();
                // 検索対象となるリストに入力された文字列が存在するかどうかを判断
                if (targetText.indexOf(searchText) != -1) {
                    $(this).parent().parent().removeClass('hidden');
                } else {
                    $(this).parent().parent().addClass('hidden');
                }
            });
        }
    };
    // 入力かラジオボタン操作で検索
    $('#search-text').on('keyup', searchTitle);
    $('input[name="search"]:radio').on('click', searchTitle);
    // 編集とかしたときに検索した状態を保存したい
    $('#output').on('click', '.set', searchTitle);

    // タイトルクリックで詳細表示
    $('#output').on('click', '.card-header', function () {
        // var id = $(this).parent().parent().attr("id");
        if (editStatus == 0) {
            var id = $(this).parent().attr("id");
            // alert(id);
            $('#' + id).find('.card-block').slideToggle();
            // $('#'+id).find('.card-text').slideToggle();
            // $('#'+id).find('.btn').slideToggle();
            // $('#'+id).find('.title').html(title);
        }
    });

    // textareaの自動リサイズ
    $('textarea').each(function () {
        $(this).css({
            'overflow': 'hidden',
            'resize': 'none'
        })
            .data('original_row', $(this).attr('rows'));
    });
    $('textarea').bind('keyup', function () {
        var self = this;
        var value = $(this).val().split("\n");
        var value_row = 0;
        $.each(value, function (i, val) {
            value_row += Math.max(Math.ceil(val.length / self.cols), 1);
        });
        var input_row = $(this).attr('rows');
        var original_row = $(this).data('original_row');
        var next_row = (input_row <= value_row) ? value_row + 1 : Math.max(value_row + 1, original_row);
        $(this).attr('rows', next_row);
    });



});
