import csv
from urllib.request import Request, urlopen
from html.parser import HTMLParser

URL = "https://www.jra.go.jp/datafile/seiseki/g1/osaka/result/osaka2025.html"


class TableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows = []
        self.row = []
        self.current = ""
        self.in_row = False
        self.in_cell = False

    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self.in_row = True
            self.row = []
        elif tag in ("td", "th") and self.in_row:
            self.in_cell = True
            self.current = ""

    def handle_data(self, data):
        if self.in_cell:
            self.current += data

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self.in_cell:
            self.row.append(" ".join(self.current.split()))
            self.in_cell = False
        elif tag == "tr" and self.in_row:
            if self.row:
                self.rows.append(self.row)
            self.in_row = False


def main():
    request = Request(URL, headers={"User-Agent": "Mozilla/5.0"})

    with urlopen(request, timeout=30) as response:
        html = response.read().decode("cp932", errors="replace")

    parser = TableParser()
    parser.feed(html)

    header = next(
        (row for row in parser.rows
         if "着順" in row and "馬番" in row and "馬名" in row),
        None
    )

    if header is None:
        raise ValueError("公式ページから結果表を見つけられませんでした")

    rank_i = header.index("着順")
    number_i = header.index("馬番")
    name_i = header.index("馬名")
    jockey_i = header.index("騎手名") if "騎手名" in header else None

    output = []

    for row in parser.rows:
        if len(row) <= max(rank_i, number_i, name_i):
            continue

        rank = row[rank_i]
        number = row[number_i]
        name = row[name_i]

        if not rank.isdigit() or not number.isdigit() or not name:
            continue

        jockey = row[jockey_i] if jockey_i is not None and len(row) > jockey_i else ""

        output.append([
            "大阪杯2025",
            number,
            name,
            "",
            "",
            "",
            "",
            jockey,
            "",
            "",
            "",
            rank
        ])

    if not output:
        raise ValueError("馬の結果を取り出せませんでした")

    with open(
        "osaka_hai_2025_official.csv",
        "w",
        newline="",
        encoding="utf-8-sig"
    ) as file:
        writer = csv.writer(file)
        writer.writerow([
            "raceName", "horseNo", "horseName", "odds",
            "form", "distance", "course", "jockey",
            "going", "runningStyle", "pace", "actualRank"
        ])
        writer.writerows(output)

    print("アプリ用CSVを作成しました。")
    print("取得した馬の数:", len(output))


if __name__ == "__main__":
    main()
