const vendorId = 0x2e8a;
const productId = 0x2002

let device_type;
let device_rev;
let device_id;
let firmware_ver;

let serialReader;
let serialWriter;

let initialized = false;

let heartbeat_interval;

async function open_serial(port) {
    await port.open({ baudRate: 115200 });
    _port = port;

    const textEncoder = new TextEncoderStream();
    readableStreamClosed = textEncoder.readable.pipeTo(port.writable);

    const textDecoder = new TextDecoderStream();
    writableStreamClosed = port.readable.pipeTo(textDecoder.writable);

    serialReader = textDecoder.readable.getReader();
    serialWriter = textEncoder.writable.getWriter();

    await serialWriter.write("di\n");
    const { value, done } = await serialReader.read();

    let device_info = value.trim().split(" ");
    firmware_ver = parseInt(device_info[0]);
    device_rev = parseInt(device_info[1]);
    device_type = device_info[2];
    device_id = device_info[3];

    $("#tab-content")[0].innerHTML = '<mdui-card variant="filled" style="width: 80%;"><mdui-list><mdui-list-item nonclickable></mdui-list-item><mdui-list-item nonclickable><h3>固件版本: '
        + firmware_ver + '</h3></mdui-list-item><mdui-list-item nonclickable><h3>硬件类型: '
        + device_type + '</h3></mdui-list-item><mdui-list-item nonclickable><h3>硬件版本: '
        + device_rev + '</h3></mdui-list-item><mdui-list-item nonclickable><h3>序列号: '
        + device_id + '</h3></mdui-list-item><mdui-list-item nonclickable></mdui-list-item></mdui-list></mdui-card>';

    heartbeat_interval = setInterval(() => {
        serialWriter.write("hb\n").then(async () => {
            const { value, done } = await serialReader.read();
            let status = value.trim();
            if (status === "wa") {
                let snackbar = $("#main-snackbar")[0];
                snackbar.innerHTML = "MISAKANITHM 正在初始化, 请稍等";
                snackbar.open = true;
            }
            else if (status === "ok") {
                if (!initialized) {
                    initialized = true;

                    let snackbar = $("#main-snackbar")[0];
                    snackbar.innerHTML = "MISAKANITHM 已连接";
                    snackbar.open = true;
                }
            }
            else if (status === "en") {
                if (initialized) {
                    clearInterval(heartbeat_interval);
                    initialized = false;

                    let snackbar = $("#main-snackbar")[0];
                    snackbar.innerHTML = "游戏已启动, 控制台已被禁用";
                    snackbar.open = true;
                }
            }
        });
    }, 1000);
}

async function init() {
    navigator.serial.getPorts().then((ports) => {
        if (ports.length !== 1) $("#device-connect-dialog")[0].open = true;
        else open_serial(ports[0]);
    });
}

$(() => {
    if (!"serial" in navigator) {
        let snackbar = $("#main-snackbar")[0];
        snackbar.innerHTML = "你的浏览器不支持连接 MISAKANITHM, 请尝试使用其他浏览器";
        snackbar.open = true;
        return;
    }

    init();

    navigator.serial.addEventListener("connect", (event) => {
        init();
    });


    navigator.serial.addEventListener("disconnect", async (event) => {
        clearInterval(heartbeat_interval);
        initialized = false;

        let snackbar = $("#main-snackbar")[0];
        snackbar.innerHTML = "MISAKANITHM 已断开连接";
        snackbar.open = true;
    });

    $(".button-menu")[0].addEventListener("click", () => {
        let main_drawer = $("#main-drawer")[0];
        main_drawer.open = !main_drawer.open;
    });

    $("#button-connect")[0].addEventListener("click", () => {
        let button = $("#button-connect")[0];
        button.loading = true;
        button.disabled = true;

        navigator.serial
            .requestPort({ filters: [{ usbVendorId: vendorId, usbProductId: productId }] })
            .then(async (port) => {
                $("#device-connect-dialog")[0].open = false;
                open_serial(port);
            });
    });

    $("#button-info")[0].addEventListener("click", () => {
        $("#tab-content")[0].innerHTML = '<mdui-card variant="filled" style="width: 80%;"><mdui-list><mdui-list-item nonclickable></mdui-list-item><mdui-list-item nonclickable><h3>固件版本: '
            + firmware_ver + '</h3></mdui-list-item><mdui-list-item nonclickable><h3>硬件类型: '
            + device_type + '</h3></mdui-list-item><mdui-list-item nonclickable><h3>硬件版本: '
            + device_rev + '</h3></mdui-list-item><mdui-list-item nonclickable><h3>序列号: '
            + device_id + '</h3></mdui-list-item><mdui-list-item nonclickable></mdui-list-item></mdui-list></mdui-card>';
    });
    $("#button-sensitivity")[0].addEventListener("click", () => {
        $("#tab-content")[0].innerHTML =
            '<mdui-card variant="filled" style="width: 80%;text-align: center;"><mdui-list><mdui-list-item nonclickable></mdui-list-item>'
            + '<mdui-list-item nonclickable><h3>调整敏感度前, 请将 MISAKANITHM 置于平整桌面, 双手远离触摸区</h3></mdui-list-item>'
            + '<mdui-list-item nonclickable><h3>触摸区会依次亮起, 红色代表上半触摸区, 绿色代表下半触摸区</h3></mdui-list-item>'
            + '<mdui-list-item nonclickable><h3>请在佩戴手套后, 用两根手指依次触摸对应区域, 直到灯光改变</h3></mdui-list-item>'
            + '<mdui-list-item nonclickable><mdui-button id="button-sensitivity-start">开始调整敏感度</mdui-button>'
            + '</mdui-list-item><mdui-list-item nonclickable></mdui-list-item></mdui-list></mdui-card>';

        $("#button-sensitivity-start")[0].addEventListener("click", () => {
            $("#button-sensitivity-start")[0].disabled = true;
            $("#button-sensitivity-start")[0].loading = true;

            serialWriter.write("ts\n");
        });
    });
    $("#button-bl")[0].addEventListener("click", () => {
        $("#bootloader-dialog")[0].open = true;
    });
    $("#button-about")[0].addEventListener("click", () => {
        $("#tab-content")[0].innerHTML =
            '<mdui-card variant="filled" style="width: 80%;text-align: center;">'
            + '<mdui-list><mdui-list-item nonclickable></mdui-list-item><mdui-list-item nonclickable><h3>Copyright © MisakaNet Team, 2024</h3></mdui-list-item>'
            + '<mdui-list-item nonclickable><h3>Console developed by Misaka 19465</h3></mdui-list-item>'
            + '<mdui-list-item nonclickable><h3>QQ 交流群: 964766640</h3></mdui-list-item><mdui-list-item nonclickable></mdui-list-item></mdui-list></mdui-card>';
    });

    $("#button-bl-confirm")[0].addEventListener("click", () => {
        $("#bootloader-dialog")[0].open = false;

        serialWriter.write("bl\n");

        clearInterval(heartbeat_interval);
        initialized = false;

        let snackbar = $("#main-snackbar")[0];
        snackbar.innerHTML = "MISAKANITHM 已断开连接";
        snackbar.open = true;
    });
});