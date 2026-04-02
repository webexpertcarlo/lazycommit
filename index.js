#!/usr/bin/env node

import { execSync } from "child_process";
import readline from "readline";
import fetch from "node-fetch";

const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.log("❌ Please set OPENAI_API_KEY");
  process.exit(1);
}

function getGitDiff() {
  try {
    return execSync("git diff --cached", { encoding: "utf-8" });
  } catch {
    console.log("❌ No staged changes found");
    process.exit(1);
  }
}

async function generateCommitMessage(diff) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Generate a short, clear, conventional commit message (like feat, fix, docs, chore) based on the git diff. Keep it under 1 line.",
        },
        {
          role: "user",
          content: diff,
        },
      ],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function main() {
  const diff = getGitDiff();
  const message = await generateCommitMessage(diff);

  console.log("\n✨ Suggested Commit Message:\n");
  console.log(message);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("\nUse this commit message? (y/n): ", (answer) => {
    if (answer.toLowerCase() === "y") {
      execSync(`git commit -m "${message}"`);
      console.log("✅ Commit created!");
    } else {
      console.log("❌ Commit canceled.");
    }
    rl.close();
  });
}

main();
