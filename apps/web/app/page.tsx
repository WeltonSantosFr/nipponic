import { Workspace } from "@/components/workspace";
import { Note } from "@nipponic/shared";

const INITIAL_NOTES: Note[] = [
  {
    id: "1",
    title: "Today's diary",
    enText: "Today the day was sunny. I went walking on the park.",
    jpText: "今日は晴れていました。公園を散歩してきました。",
    updatedAt: "10:30",
  },
  {
    id: "2",
    title: "Restaurant phrases",
    enText: "One water please. The tab please.",
    jpText: "お水をください。お会計をお願いします。",
    updatedAt: "08:15",
  },
  {
    id: "3",
    title: "JLPT N5 Vocab",
    enText: "Study kanji of time and directions.",
    jpText: "時間と方向の漢字を勉強する。",
    updatedAt: "Yesterday",
  },
];



export default function Home() {
  return <Workspace initialNotes={INITIAL_NOTES} />;
}
