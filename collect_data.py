import csv
import os

def main():
    # 過去GⅠデータを保存するCSVのひな形を作成
    filename = "g1_results.csv"

    headers = [
        "raceName",
        "horseNo",
        "horseName",
        "odds",
        "form",
        "distance",
        "course",
        "jockey",
        "going",
        "runningStyle",
        "pace",
        "actualRank",
    ]

    if not os.path.exists(filename):
        with open(filename, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            writer.writerow(headers)

    print(f"{filename} の準備ができました。")
    print("次の段階で、実際の過去GⅠデータを取得する処理を追加します。")

if __name__ == "__main__":
    main()
