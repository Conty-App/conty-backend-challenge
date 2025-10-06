package domain

type Payment struct {
	BatchID    string
	Processed  int64
	Successful int64
	Failed     int64
	Duplicates int64
	Details    []Detail
}
