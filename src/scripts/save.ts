import { BaseDirectory, readTextFile, writeTextFile } from "@tauri-apps/api/fs";

function makeSaveSystem(saveFileName: string) {
  return {
    data: {
      maxScore: 0,
    },
    async save() {
      await writeTextFile(saveFileName, JSON.stringify(this.data), {
        dir: BaseDirectory.AppLocalData,
      });
    },
    async load() {
      try {
        this.data = JSON.parse(
          await readTextFile(saveFileName, { dir: BaseDirectory.AppLocalData })
        );
      } catch {
        this.data = {
          maxScore: 0,
        };
      }
    },
  };
}

export const saveSystem = makeSaveSystem("save.json");
