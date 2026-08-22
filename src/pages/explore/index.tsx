import { useAtomValue } from "jotai";
import { ArticleItem } from "../../components/items/article";
import { articlesState } from "@/state";

function ExplorePage() {
  const articles = useAtomValue(articlesState);
  return (
    <div className="flex w-full flex-col space-y-6 py-4 px-4">
      {articles.map((item, index) => (
        <ArticleItem key={index} {...item} />
      ))}
    </div>
  );
}

export default ExplorePage;
