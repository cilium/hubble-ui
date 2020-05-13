package logger

import (
	"log"
	"os"

	"github.com/fatih/color"
)

var (
	yellow = color.New(color.FgHiYellow, color.Bold).SprintFunc()
	red    = color.New(color.FgHiRed, color.Bold).SprintFunc()
	green  = color.New(color.FgHiGreen, color.Bold).SprintFunc()
)

func New(component string) Logger {
	infoPrefix := green("info:"+component) + ": "
	warnPrefix := yellow("warn:"+component) + ": "
	errPrefix := red("error:"+component) + ": "

	infoLogger := log.New(os.Stdout, infoPrefix, 0)
	warnLogger := log.New(os.Stdout, warnPrefix, 0)
	errLogger := log.New(os.Stderr, errPrefix, 0)

	return Logger{
		component,
		infoLogger,
		warnLogger,
		errLogger,
	}
}

func (self *Logger) Sub(subcomponent string) *Logger {
	component := self.component + ":" + subcomponent
	log := New(component)

	return &log
}
