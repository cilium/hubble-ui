package log_file

import (
	"os"
	"path/filepath"
)

type LogFile struct {
	filePath string
}

func OpenLogFile(filePath string) (*LogFile, error) {
	filePath = filepath.Clean(filePath)
	if _, err := os.Stat(filePath); err != nil {
		return nil, err
	}

	return &LogFile{
		filePath: filePath,
	}, nil
}

func (lf *LogFile) JsonIterator() (*JsonIterator, error) {
	f, err := os.Open(lf.filePath)
	if err != nil {
		return nil, err
	}

	return NewJsonIterator(f), nil
}
