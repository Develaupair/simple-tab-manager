/**
This file is part of the "Simple Tab Manager" Firefox addon
Copyright (C) 2020  Anubosiris

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

let browserInterface: any;
try {
    // @ts-ignore
    browserInterface = browser;
} catch {
    // @ts-ignore
    browserInterface = chrome;
}
const aboutMask: RegExp = new RegExp("about:.*");
const chromeMask: RegExp = new RegExp("chrome:.*");
const urlMask: RegExp = new RegExp("[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)"); // RegEx for URLs taken from https://stackoverflow.com/a/3809435

const tabGetter: any = {
    tabs: [],

    isRealisticUrl(url: string): boolean {
        return  !(url == "undefined" || aboutMask.test(url) || chromeMask.test(url))
    },
    async updatetabs() {
        await browserInterface.tabs.query({}, function (tab) {
            tabGetter.tabs = [];
            let newHTML: string = "";
            for (let i = 0; i < tab.length; i++) {
                if (tabGetter.isRealisticUrl(tab[i].url)) {
                    tabGetter.tabs.push(tab[i].url);
                    newHTML += "<tr><td>" + tab[i].url + "</td></tr>";
                }
            }
            document.getElementById("tabtable").innerHTML = newHTML;
        });
    },
    async copyToClipboard() {
        let newClipboardContent: string = "";
        for (let x of tabGetter.tabs) {
            newClipboardContent += x + "\n";
        }
        await navigator.clipboard.writeText(newClipboardContent);
    },
    async openFromClipboard() {
        tabGetter.tabs = [];
        //alert("This feature is under development!");
        // @ts-ignore
        if (browserInterface != chrome) {
            //Firefox
            await navigator.clipboard.readText().then(content => {
                this.lineStringToTabs(content);
                window.close()
            }).catch(err => {
                console.error("Unable to read clipboard", err);
                alert("Failed to read clipboard, check the extension's permissions.");
            });
        } else {
            // Firefox method doesn't work with Chrome
            // --> workaround based on https://stackoverflow.com/a/18455088/4204557
            console.log("chrome detected --> workaround used for clipboard access");
            let target: HTMLTextAreaElement = document.createElement("textarea");
            target.contentEditable = "true";
            target.className = "invisible";
            target.id = "clipBoardTarget";
            document.body.appendChild(target);
            target.focus();
            document.execCommand("paste");
            let content = target.value;
            document.body.removeChild(target);
            await this.lineStringToTabs(content);
            window.close()
        }
    },
    async lineStringToTabs(lines: string) {
        let linearray: string[] = lines.split("\n");
        let newHTML: string = "";
        for (let i = 0; i < linearray.length; i++) {
            linearray[i] = linearray[i].replace("\n", "").trim();
            if (urlMask.test(linearray[i])) {
                newHTML += "<tr><td>" + linearray[i] + "</td></tr>";
                browserInterface.tabs.create({url: linearray[i]});
            }
        }
    },
    async exportToFile() {
        let content: string = "";
        for (let i in this.tabs) {
            if (this.isRealisticUrl(this.tabs[i].toString)) {content+=this.tabs[i] + "\n";}
        }
        if (content != ""){
            const url: string = URL.createObjectURL(new Blob([content], {type: "text/plain;charset=utf-8"}));
            browserInterface.downloads.download({url: url, filename: "simple.tabs"})
        }
    },
    async importFromFile() {
        alert("This feature is not supported yet!  :( ");
    },
    constructor() {
        this.tabs = [];
        this.updatetabs();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("button_copy").addEventListener("click", () => {
        tabGetter.copyToClipboard();
    });
    document.getElementById("button_paste").addEventListener("click", () => {
        tabGetter.openFromClipboard();
    });
    document.getElementById("button_export").addEventListener("click", () => {
        tabGetter.exportToFile();
    });
    document.getElementById("button_import").addEventListener("click", () => {
        tabGetter.importFromFile();
    });
    tabGetter.updatetabs()
});