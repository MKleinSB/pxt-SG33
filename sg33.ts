/**
 * XinaBox SG33 extension for makecode
 */

enum CSS811_MEAS_MODE {
    //% block="IDLE"
    MODE_IDLE = 0x00,
    //% block="1SEC"
    MODE_1SEC = 0x10,
    //% block="10SEC"
    MODE_10SEC = 0x20,
    //% block="60SEC"
    MODE_60SEC = 0x30,
    //% block="250MS"
    MODE_250MS = 0x40
}

/**
 * SG33 block
 */
//% color=#444444 icon="\uf2dc"
//% groups=['On start', 'Variables', 'Optional']
namespace SG33 {
    let SG33_ADDR = 0x5A

    function writereg(dat: number): void {
        pins.i2cWriteNumber(SG33_ADDR, dat, NumberFormat.UInt8BE);
    }

    function setreg(reg: number, dat: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = dat;
        pins.i2cWriteBuffer(SG33_ADDR, buf);
    }

    function getreg(reg: number): number {
        pins.i2cWriteNumber(SG33_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(SG33_ADDR, NumberFormat.UInt8BE);
    }

    function getInt8LE(reg: number): number {
        pins.i2cWriteNumber(SG33_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(SG33_ADDR, NumberFormat.Int8LE);
    }

    function getUInt16LE(reg: number): number {
        pins.i2cWriteNumber(SG33_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(SG33_ADDR, NumberFormat.UInt16LE);
    }

    function getInt16LE(reg: number): number {
        pins.i2cWriteNumber(SG33_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(SG33_ADDR, NumberFormat.Int16LE);
    }

    writereg(0xF4)

    if (checkForStatusError()) {
        // include method to show we have an error in the device
    }

    disableInterrupt();

    setDriveMode(CSS811_MEAS_MODE.MODE_1SEC);

    // get new sensor data from SG33
    function get(): void {
        if (dataAvailable()) {
            getAlgorithmResults();
        }
    }

    /**
    * The CCS811 has 5 modes of operation
    * http://ams.com/eng/content/download/951091/2269479/471718
    * @param u the meas mode
    */
    //% blockId="SG33_SET_MEAS_MODE" block="SG33 MEAS MODE %u"
    //% group="Optional"
    //% weight=84 blockGap=8
    export function setDriveMode(u: CSS811_MEAS_MODE): void {
        let meas_mode = getreg(0x01);
        meas_mode &= 0x0C;
        setreg(0x01, meas_mode | u);
    }

    // checks if the sensors started with an error
    function checkForStatusError(): boolean {
        let error = getreg(0x00);

        if (error & 0x01) {
            return true;
        }
        return false;
    }

    /**
    * The SG33 has an alternative to Power-On reset 
    * http://ams.com/eng/content/download/951091/2269479/471718
    */
    //% blockId="SG33_SW_RESET"
    //% group="Optional"
    //% weight=84 blockGap=8
    export function softwareReset(): void {
        let buf = pins.createBuffer(5);
        buf[0] = 0xFF;
        buf[1] = 0x11;
        buf[2] = 0xE5;
        buf[3] = 0x72;
        buf[4] = 0x8A;
        pins.i2cWriteBuffer(SG33_ADDR, buf);
    }

    let eCO2 = 0
    let TVOC = 0

    // get new data from registers
    function getAlgorithmResults(): void {
        let buf = pins.createBuffer(8);

        buf = pins.i2cReadBuffer(SG33_ADDR, 8, false);

        eCO2 = (buf[0] << 8) || (buf[1]);
        TVOC = (buf[2] << 8) || (buf[3]);
    }


    // checks if the SG33 has new data available
    function dataAvailable(): boolean {
        let status = getreg(0x00);
        let ready = (status & 1 << 3);
        if (!ready) {
            return false;
        }
        return true;
    }

    /**
     * Volatile organic compounds (VOCs)
     * https://en.wikipedia.org/wiki/Volatile_organic_compound
     * @param u the pressure unit
     */
    //% blockId="SG33_GET_TVOC"
    //% group="Variables"
    //% weight=84 blockGap=8
    export function getTVOC(): number {
        get();
        return TVOC;
    }

    /**
     * The temperature in degrees Celcius or Fahrenheit
     * https://en.wikipedia.org/wiki/Carbon_dioxide
     * https://en.wikipedia.org/wiki/Carbon_dioxide_sensor#Estimated_CO2_sensor
     */
    //% blockId="SG33_GET_eC02"
    //% group="Variables"
    //% weight=88 blockGap=8
    export function getCO2(): number {
        get();
        return eCO2;
    }

    /**
     * Enable interrupts on the SG33
     */
    //% blockId="SG33_ENABLE_INT"
    //% group="Optional"
    //% weight=98 blockGap=8
    export function enableInterrupt() {
        let meas_mode = getreg(0x01);
        meas_mode ^= (-1 ^ meas_mode) & (1 << 3);
        setreg(0x01, meas_mode);
    }

    /**
     * Disable interrupts on the SG33
     */
    //% blockId="SG33_DISABLE_INT"
    //% group="Optional"
    //% weight=98 blockGap=8  
    export function disableInterrupt() {
        let meas_mode = getreg(0x01);
        meas_mode &= ~(1 << 3);
        setreg(0x01, meas_mode);
    }

    /**
     * Set I2C address
     * On:  0x76
     * Off: 0x77
     * @param on on is I2C address 0x5A, off is 0x5B
     */
    //% blockId="SG33_SET_ADDRESS" block="SG33 address %on"
    //% group="Optional"
    //% weight=50 blockGap=8
    //% on.shadow="toggleOnOff"
    export function address(on: boolean) {
        if (on) SG33_ADDR = 0x5A
        else SG33_ADDR = 0x5B
    }

    function fix(x: number) {
        return Math.round(x * 1) / 1
    }
}