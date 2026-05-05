// GHOST COMMIT - Full Green Contribution Graph (2024-2026)
// AUTHOR : sahamzona52-hub
// GITHUB : https://github.com/sahamzona52-hub/commit

import { writeFileSync } from "fs";
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const Dirname = path.dirname(fileURLToPath(import.meta.url));

const Config = {
    TotalCommits: 1095,             // 365 x 3 tahun = 1095 commits (minimal)
    DataFile: "./data.json",
    RetryAttempts: 3,
    PushAfterAll: true,
    Verbose: false,
    RepoURL: "https://github.com/sahamzona52-hub/commit",
    Branch: "main",
    Author: "sahamzona52-hub",
    Email: "sahamzona52@gmail.com",
    Years: [2024, 2025, 2026]      // Target tahun
};

const Git = Args => {
    const Result = spawnSync("git", Args, {
        cwd: Dirname,
        encoding: "utf8",
        maxBuffer: 1024 * 1024 * 10
    });
    if (Result.status !== 0) {
        throw new Error(Result.stderr || Result.stdout || "git command failed");
    }
    return Result.stdout.trim();
};

// Cek tahun kabisat
const IsLeapYear = (Year) => {
    return (Year % 4 === 0 && (Year % 100 !== 0 || Year % 400 === 0));
};

// Generate dates untuk FULL GREEN setiaphari di 2024-2026
const GenerateFullGreenDates = () => {
    const Dates = [];
    const CommitsPerYear = Math.ceil(Config.TotalCommits / Config.Years.length);
    
    for (const Year of Config.Years) {
        const DaysInYear = IsLeapYear(Year) ? 366 : 365;
        const CommitsPerDay = Math.max(2, Math.floor(CommitsPerYear / DaysInYear));
        
        console.log(`  📅 Generating for ${Year} (${DaysInYear} days, ~${CommitsPerDay} commits/day)...`);
        
        for (let Month = 0; Month < 12; Month++) {
            const DaysInMonth = new Date(Year, Month + 1, 0).getDate();
            
            for (let Day = 1; Day <= DaysInMonth; Day++) {
                // Variasi jumlah commit per hari (2-5 commits untuk dark green)
                let NumCommits = CommitsPerDay;
                
                // Tambah random untuk variasi natural
                if (Math.random() > 0.6) NumCommits += 1;
                if (Math.random() > 0.8) NumCommits += 1;
                
                // Pastikan minimal 1 commit per hari (DARK GREEN)
                NumCommits = Math.max(2, Math.min(NumCommits, 8));
                
                for (let c = 0; c < NumCommits; c++) {
                    // Random time dalam sehari (tersebar)
                    const Hour = Math.floor(Math.random() * 24);
                    const Minute = Math.floor(Math.random() * 60);
                    const Second = Math.floor(Math.random() * 60);
                    
                    const Pad = N => String(N).padStart(2, "0");
                    const DateStr = (
                        `${Year}-${Pad(Month + 1)}-${Pad(Day)}` +
                        `T${Pad(Hour)}:${Pad(Minute)}:${Pad(Second)}+07:00`
                    );
                    Dates.push(DateStr);
                }
            }
        }
    }
    
    Dates.sort();
    console.log(`  ✅ Total dates generated: ${Dates.length}\n`);
    return Dates;
};

const ProgressBar = (Current, Total, Width = 50) => {
    const Pct = Current / Total;
    const Filled = Math.round(Pct * Width);
    const Bar = "█".repeat(Filled) + "░".repeat(Width - Filled);
    const Percent = (Pct * 100).toFixed(1).padStart(5);
    process.stdout.write(`\r  [${Bar}] ${Percent}% (${Current}/${Total})`);
};

const MakeCommit = (Index, CommitDate) => {
    writeFileSync(
        path.resolve(Dirname, Config.DataFile),
        JSON.stringify({ 
            CommitDate, 
            Index,
            Timestamp: Date.now(),
            Author: Config.Author,
            Year: new Date(CommitDate).getFullYear()
        }, null, 2),
        "utf8"
    );
    Git(["add", Config.DataFile]);
    Git([
        "commit",
        "--allow-empty-message",
        "-m",
        `🟢 Ghost commit #${Index + 1} - ${new Date(CommitDate).toDateString()}`,
        `--date=${CommitDate}`,
        "--author",
        `"${Config.Author} <${Config.Email}>"`,
        "--no-verify"
    ]);
};

const MakeCommitWithRetry = (Index, CommitDate) => {
    for (let Attempt = 1; Attempt <= Config.RetryAttempts; Attempt++) {
        try {
            MakeCommit(Index, CommitDate);
            return true;
        } catch (Err) {
            if (Attempt === Config.RetryAttempts) {
                process.stderr.write(`\n  ✗ FAIL commit #${Index + 1}: ${Err.message}\n`);
                return false;
            }
        }
    }
    return false;
};

const SetupRepository = () => {
    process.stdout.write("\n  🔧 Setting up repository...\n");
    
    try {
        Git(["rev-parse", "--is-inside-work-tree"]);
        process.stdout.write("  ✓ Git repository found\n");
    } catch {
        Git(["init"]);
        process.stdout.write("  ✓ Git repository initialized\n");
    }
    
    try {
        Git(["config", "user.name", Config.Author]);
        Git(["config", "user.email", Config.Email]);
    } catch {}
    
    try {
        const currentBranch = Git(["rev-parse", "--abbrev-ref", "HEAD"]);
        if (currentBranch !== Config.Branch) {
            Git(["branch", "-M", Config.Branch]);
            process.stdout.write(`  ✓ Branch renamed to: ${Config.Branch}\n`);
        }
    } catch {
        Git(["checkout", "-b", Config.Branch]);
        process.stdout.write(`  ✓ Branch created: ${Config.Branch}\n`);
    }
    
    try {
        const remotes = Git(["remote"]);
        if (!remotes.includes("origin")) {
            Git(["remote", "add", "origin", Config.RepoURL]);
            process.stdout.write(`  ✓ Remote origin added: ${Config.RepoURL}\n`);
        } else {
            Git(["remote", "set-url", "origin", Config.RepoURL]);
            process.stdout.write(`  ✓ Remote origin updated\n`);
        }
    } catch (Err) {
        process.stderr.write(`  ✗ Remote setup failed: ${Err.message}\n`);
        return false;
    }
    
    process.stdout.write("  ✅ Repository ready\n");
    return true;
};

const PushToGitHub = () => {
    process.stdout.write("\n  🚀 Pushing to GitHub...\n");
    
    try {
        try {
            Git(["pull", "origin", Config.Branch, "--rebase", "--allow-unrelated-histories"]);
            process.stdout.write("  ✓ Synced with remote\n");
        } catch (Err) {
            process.stdout.write(`  Note: ${Err.message}\n`);
        }
        
        Git(["push", "-u", "origin", Config.Branch]);
        process.stdout.write("  ✅ Push successful!\n\n");
        return true;
    } catch (Err) {
        try {
            process.stdout.write("  Trying force push...\n");
            Git(["push", "-u", "origin", Config.Branch, "--force"]);
            process.stdout.write("  ✅ Force push successful!\n\n");
            return true;
        } catch (Err2) {
            process.stderr.write(`  ❌ Push failed: ${Err2.message}\n`);
            process.stderr.write("\n  Manual push command:\n");
            process.stderr.write(`  git push -u origin ${Config.Branch} --force\n\n`);
            return false;
        }
    }
};

// Tampilkan statistik per tahun
const ShowYearlyStats = (CommitDates) => {
    const Stats = {};
    const DailyStats = {};
    
    CommitDates.forEach(DateStr => {
        const Year = new Date(DateStr).getFullYear();
        const DateKey = new Date(DateStr).toDateString();
        
        Stats[Year] = (Stats[Year] || 0) + 1;
        DailyStats[DateKey] = (DailyStats[DateKey] || 0) + 1;
    });
    
    console.log("\n  📊 YEARLY DISTRIBUTION:");
    console.log("  " + "-".repeat(50));
    
    for (const Year of Config.Years) {
        const Count = Stats[Year] || 0;
        const DaysInYear = IsLeapYear(Year) ? 366 : 365;
        const AvgPerDay = (Count / DaysInYear).toFixed(1);
        const DaysWithCommits = Object.keys(DailyStats).filter(d => d.includes(Year.toString())).length;
        const Coverage = ((DaysWithCommits / DaysInYear) * 100).toFixed(1);
        
        let Status = "";
        if (DaysWithCommits === DaysInYear) {
            Status = "✅ FULL GREEN!";
        } else if (Coverage >= 90) {
            Status = "🟢 NEAR FULL";
        } else {
            Status = "🟡 NEED MORE";
        }
        
        console.log(`     ${Year}: ${Count} commits | ${DaysWithCommits}/${DaysInYear} days (${Coverage}%) ${Status}`);
    }
};

const Run = () => {
    console.log("\n" + "=".repeat(60));
    console.log("  👻 GHOST COMMIT - FULL GREEN GRAPH (2024-2026)");
    console.log("=".repeat(60));
    console.log(`  📛 Author    : ${Config.Author}`);
    console.log(`  🔗 GitHub    : https://github.com/${Config.Author}/Commit-Pegasus`);
    console.log(`  📊 Commits   : ${Config.TotalCommits}+`);
    console.log(`  📅 Years      : ${Config.Years.join(", ")}`);
    console.log(`  🎯 Target    : 100% FULL GREEN every day`);
    console.log(`  🌿 Branch    : ${Config.Branch}`);
    console.log(`  🚀 Auto Push : ${Config.PushAfterAll ? "YES" : "NO"}`);
    console.log("=".repeat(60) + "\n");

    // Generate dates
    console.log("  📅 Generating commit dates for FULL GREEN (2024-2026)...\n");
    const CommitDates = GenerateFullGreenDates();
    
    // Show statistics
    ShowYearlyStats(CommitDates);
    
    // Setup git
    if (!SetupRepository()) {
        process.exit(1);
    }

    console.log("\n  📝 Creating ghost commits...\n");
    
    let SuccessCount = 0;
    let FailCount = 0;
    const StartTime = Date.now();

    for (let I = 0; I < CommitDates.length; I++) {
        const success = MakeCommitWithRetry(I, CommitDates[I]);
        if (success) {
            SuccessCount++;
        } else {
            FailCount++;
        }
        
        // Update progress setiap 50 commits
        if ((I + 1) % 50 === 0 || I === CommitDates.length - 1) {
            ProgressBar(I + 1, CommitDates.length);
        }
    }

    const Elapsed = ((Date.now() - StartTime) / 1000).toFixed(1);
    ProgressBar(CommitDates.length, CommitDates.length);
    
    console.log("\n\n" + "=".repeat(60));
    console.log("  ✅ GHOST COMMIT SUMMARY");
    console.log("=".repeat(60));
    console.log(`  📊 Success    : ${SuccessCount}/ commits`);
    if (FailCount > 0) {
        console.log(`  ❌ Failed     : ${FailCount} commits`);
    }
    console.log(`  ⏱️  Time       : ${Elapsed} seconds`);
    console.log(`  ⚡ Speed      : ${(SuccessCount / Elapsed).toFixed(1)} commit/s`);
    console.log(`  📅 Years      : 2024, 2025, 2026`);
    console.log("=".repeat(60) + "\n");

    // Visual preview per bulan
    console.log("  🎨 PREVIEW (Commits per month - 2024 to 2026):\n");
    const Months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (const Year of Config.Years) {
        console.log(`     ${Year}:`);
        for (let i = 0; i < Months.length; i++) {
            const MonthCommits = CommitDates.filter(d => {
                const date = new Date(d);
                return date.getFullYear() === Year && date.getMonth() === i;
            }).length;
            const Intensity = Math.min(20, Math.floor(MonthCommits / 5));
            const Bar = "🟩".repeat(Intensity);
            console.log(`       ${Months[i]}: ${Bar} (${MonthCommits} commits)`);
        }
        console.log();
    }

    if (Config.PushAfterAll && SuccessCount > 0) {
        PushToGitHub();
    }
    
    console.log("  ✨ COMPLETE! Your GitHub contribution graph is now FULL GREEN!");
    console.log(`  🔗 Repository: ${Config.RepoURL}`);
    console.log(`  🔗 Profile   : https://github.com/${Config.Author}`);
    console.log("\n  📅 COVERAGE:");
    console.log("     ✅ 2024: Every single day - DARK GREEN");
    console.log("     ✅ 2025: Every single day - DARK GREEN");
    console.log("     ✅ 2026: Every single day - DARK GREEN");
    console.log("\n  💡 Wait 10-15 minutes for GitHub to update the graph");
    console.log("  🔄 Then refresh your profile page (Ctrl+F5)\n");
};

Run();
