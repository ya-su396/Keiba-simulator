import csv
from urllib.request import Request, urlopen
from html.parser import HTMLParser

URL = "https://www.jra.go.jp/datafile/seiseki/g1/osaka/result/osaka2025.html"

class TableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_cell = False
        self.current = ""
        self.row = []
        self.rows = []
        self.in_row = False

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
    request = Request(
        URL,
        headers={"User-Agent": "Mozilla/5.0"}
    )

    with urlopen(request, timeout=30) as response:
        html = response.read().decode("utf-8", errors="replace")

    parser = TableParser()
    parser.feed(html)

    with open(
        "osaka_hai_2025_official.csv",
        "w",
        newline="",
        encoding="utf-8-sig"
    ) as file:
        writer = csv.writer(file)
        writer.writerow(["officialResultRow"])
        writer.writerows(parser.rows)

    print("公式ページの表をCSVに保存しました。")
    print("保存先: osaka_hai_2025_official.csv")
    print("取得した表の行数:", len(parser.rows))

if __name__ == "__main__":
    main()
