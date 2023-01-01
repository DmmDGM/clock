// Imports
import chalk from "chalk";
import { spawn } from "node:child_process";
import path from "node:path";
import { emitKeypressEvents } from "node:readline";
import { fileURLToPath } from "node:url";

// Namespace
namespace Clock {
    // Constants
    const colon = "  ██  ";
    const day = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thusday", "Friday", "Saturday" ];
    const meridiemFonts = {
        "A": [ "██████", "██  ██", "██████", "██  ██", "██  ██" ],
        "M": [ "██      ██", "████  ████", "██  ██  ██", "██      ██", "██      ██" ],
        "P": [ "██████", "██  ██", "██████", "██    ", "██    " ]
    };
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const numberFonts = {    
        "0": 119, "1": 3,   "2": 94,  "3": 31,  "4": 43,
        "5": 61,  "6": 125, "7": 7,   "8": 127, "9": 63
    };
    const space = "      ";
    const width = process.stdout.columns;
    const timePadding = " ".repeat(Math.max(width - 78, 0) / 2);
    const root = path.join(fileURLToPath(import.meta.url), "../");

    // Variables
    let flicker = false;
    let lastSecond = 0;
    let muted = true;

    // Detector
    if(width < 80) {
        console.error(chalk.redBright.bold("Terminal width must be greater than 80!"));
        console.error(`Current Terminal Width: ${chalk.yellowBright(width.toString())}`);
        console.error("Please rerun the program after expanding the terminal.");
        process.exit(1);
    }

    // Keypress
    emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("keypress", (str, key) => {
        if(key.ctrl && key.name === "c") process.exit();
        if(key.name === "m") muted = !muted;
    });

    // Hide Cursor
    process.stdout.write("\x1b[?25l");

    // Update Loop
    setInterval(() => {
        // Variables
        let now = new Date();
        let date = now.getDate();
        let hours = now.getHours();
        let month = now.getMonth();
        let seconds = now.getSeconds();
        let year = now.getFullYear();
        let [ hoursText, minutesText, secondsText ] = [ hours % 12, now.getMinutes(), seconds ]
            .map(time => time.toString().padStart(2, "0").split("").map(number => renderNumber(numberFonts[number as keyof typeof numberFonts])));
        let dateText = `${year} ${months[month]} ${date}, ${day[now.getDay()]}`;

        // Second Loop
        if(lastSecond !== seconds) {
            // Audio
            let args = [
                path.join(root, "tick.ogg"),
                "-nodisp", "-autoexit", "-loglevel", "quiet"
            ];
            if (!muted) {
                if(process.platform === "win32" && !muted) spawn(path.join(root, "ffmpeg/bin/ffplay.exe"), args);
                if(process.platform === "linux" && !muted) spawn("ffplay", args);
            }
    
            // States
            flicker = !flicker;
            lastSecond = seconds;
        }

        // Renderer
        console.clear();
        console.log("\n".repeat(5));
        for(let i = 0; i < 5; i++) {
            let colonText = (flicker && i % 2) ? colon : space;
            console.log(
                timePadding +
                hoursText.map(text => text[i]).join("  ") + colonText +
                minutesText.map(text => text[i]).join("  ") + colonText +
                secondsText.map(text => text[i]).join("  ") + space +
                meridiemFonts[hours < 12 ? "A" : "P"][i] + "  " + meridiemFonts["M"][i]
            );
        }
        console.log("\n");
        console.log(" ".repeat(Math.floor((width - dateText.length) / 2)) + dateText);

        // New Year
        if(month === 0 && date === 1) {
            console.log("\n".repeat(3))
            let specialTexts = [
                "Happy New Years from DmmD!",
                `Good bye ${year - 1}! Greetings ${year}!`
            ]
            for(let i = 0; i < specialTexts.length; i++)
                console.log(" ".repeat(Math.floor((width - specialTexts[i].length) / 2)) + chalk.yellowBright(specialTexts[i]));
        }
    }, 100);

    // Functions
    function renderNumber(data: number): string[] {
        return [
            [ 36, 4, 6 ],
            [ 32, 0, 2 ],
            [ 104, 8, 11 ],
            [ 64, 0, 1 ],
            [ 80, 16, 17 ]
        ].map(row => row.map(column => data & column ? "██" : "  ").join(""));
    }
}
