package logger

import (
	"log"
)

type Logger struct {
	component  string
	infoLogger *log.Logger
	warnLogger *log.Logger
	errLogger  *log.Logger
}

// Info methods
func (self *Logger) Info(v ...interface{}) {
	self.infoLogger.Print(v...)
}

func (self *Logger) Infoln(v ...interface{}) {
	self.infoLogger.Println(v...)
}

func (self *Logger) Infof(format string, v ...interface{}) {
	self.infoLogger.Printf(format, v...)
}

// Warn methods
func (self *Logger) Warn(v ...interface{}) {
	self.warnLogger.Print(v...)
}

func (self *Logger) Warnln(v ...interface{}) {
	self.warnLogger.Println(v...)
}

func (self *Logger) Warnf(format string, v ...interface{}) {
	self.warnLogger.Printf(format, v...)
}

// Err methods
func (self *Logger) Error(v ...interface{}) {
	self.errLogger.Print(v...)
}

func (self *Logger) Errorln(v ...interface{}) {
	self.errLogger.Println(v...)
}

func (self *Logger) Errorf(format string, v ...interface{}) {
	self.errLogger.Printf(format, v...)
}
