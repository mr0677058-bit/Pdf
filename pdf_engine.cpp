#include <iostream>
#include <string>
#include <cstdlib>

using namespace std;

int main(int argc, char* argv[]) {
    if (argc < 4) return 1;

    string action = argv[1];
    string input = argv[2];
    string output = argv[3];
    string param = (argc > 4) ? argv[4] : "";
    string command = "";

    if (action == "encrypt") {
        command = "qpdf --encrypt " + param + " " + param + " 256 -- \"" + input + "\" \"" + output + "\"";
    } 
    else if (action == "decrypt") {
        command = "qpdf --decrypt --password=\"" + param + "\" \"" + input + "\" \"" + output + "\"";
    }
    else if (action == "compress") {
        string level = (param == "extreme") ? "/screen" : (param == "high") ? "/printer" : "/ebook";
        command = "gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=" + level + " -dNOPAUSE -dQUIET -dBATCH -sOutputFile=\"" + output + "\" \"" + input + "\"";
    }
    else if (action == "grayscale") {
        command = "gs -sDEVICE=pdfwrite -sColorConversionStrategy=Gray -dProcessColorModel=/DeviceGray -dCompatibilityLevel=1.4 -dNOPAUSE -dQUIET -dBATCH -sOutputFile=\"" + output + "\" \"" + input + "\"";
    }
    else {
        return 1; // Unrecognized C++ action
    }

    return system(command.c_str()) == 0 ? 0 : 1;
}
