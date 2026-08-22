import { newsByIdState } from "@/state";
import { useAtomValue } from "jotai";
import { useParams } from "react-router-dom";
import NotFound from "../404";

function NewsPage() {
  const { id } = useParams();
  const news = useAtomValue(newsByIdState(Number(id)));

  if (!news) {
    return <NotFound />;
  }

  return (
    <div
      className="flex w-full flex-col gap-4 p-4 text-sm leading-[150%]"
      dangerouslySetInnerHTML={{ __html: news.content }}
    />
  );
}

export default NewsPage;
