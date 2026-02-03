; Shamus+ Patch Utility
; slx, 2017
;
; Version 1.0
;
; for MAD-Assembler 1.9.x 
;
;Shamus was originally written by William Mataga and published by Synapse Software in 1982. 
;Copyright is assumed to be with Cathryn Mataga at the time of this patch. 
;The C64 levels are believed to have been developed by Jack L. Thornton 
;who is named on the C64 version title page. 
;I have been unable to contact either of them and hope that they approve of this patch. 
;
;Copyright of the patch and conversion software is with the author (slx).
;
;Permission to use, copy, modify, and distribute this software for any
;purpose without fee is hereby granted, provided that the above
;copyright notice and this permission notice appear in all copies.
;
;Should any of this interfere with any copyright of the original author(s), 
;their copyright shall have precedence.
;
;THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
;WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
;MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
;ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
;WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
;ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
;OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
;
; Special thanks to the authors of all the utilities used in the creation of this patch,
; especially phaeron for Altirra, David Firth for Atari800MacX, Peter Dell for WUDSN,
; Rob McMullen for Omnivore, the VICE team members for x64, Clinton Parker & JAC! for Action!, 
; samar productions for C64Debugger.
; 
; throughout this program map segments are referred to as follows
; the address refers to the storage address of the Atari original map in the
; original program
; map segment 1: $23F2 (horizontal bars)
; map segment 1: $2472 (vertical bars)
; map segment 1: $1D43 (objects)
; map segment 1: $1DC3 (colours / keyhole room door location)
; map segment 5: $1EE3 (pod rooms)
; map segment 6: $24F8 (level boundaries)
;
; System equates:
;
CONSOL		equ	$D01F
SETVBV		equ $E45C
XITVBV		equ $E462
NMIEN		equ $D40E
DLISTL		equ $D402
DLISTH		equ $D403
KBCODE		equ $D209
SKSTAT		equ $D20F
SKCTL		equ SKSTAT
SKRES		equ $D20A
AUDF1		equ $D200
HITCLR		equ $D01E
TRIG0		equ $D010
VVBLKI		equ $0208
VCOUNT		equ $D40B

			org $3480
			ins "Shamus.com game code.dat" 
;insert original Atari game code
;this is the binary form of the code (i.e. without executable file header bytes)
;to be loaded at $3480
; 
;original code needs to be run from $7000
;
; this code is executed after the end of the orignal game init code, replacing the last instruction
; of the original game init code.
;
			org $701C
			
TITLEPATCH	LDA #$0C
 			STA $0552
 			STA $0566
 			LDA #$3F
 			STA $055C
; add blue plus sign to right of Shamus on title screen

DLISTPATCH1	LDA #$01
			STA $0C5F
			STA $35D7
; patch jump instructions to ends of menu and in-game display lists

			LDA <MENUDLIST
			STA $0C60
			LDA >MENUDLIST
			STA $0C61
;patch end of menu display list to point to new list with extra line for selected level

			LDA <GAMEDLIST
			STA $35D8
			LDA >GAMEDLIST
			STA $35D9
;patch end of in-game display list to point to new list with extra line for selected level

			LDA #(SCRLTXTWRAP-SCRLTXTBEG)
			STA $182E
;set $182E to length of new title string
;$182E is checked to see if scrolling needs to reset

			LDA <SCRLTXTBEG
			STA $1838
			LDA >SCRLTXTBEG
			STA $183D
;change address of moving title string to modded data			

			LDA #$20
			STA $260A
			LDA <MAPSELECT
			STA $260B
			LDA >MAPSELECT
			STA $260C			
;patch start of CONSOL read routine with a JSR to a new subroutine checking OPTION key
; by replacing the LDA CONSOL instruction with a JSR.
;
			LDY #$06
LOOP0		LDA COLORSHIFTCODE,Y
			STA $4979,Y
			DEY
			BNE LOOP0
;this replaces the original color shift routine with a JSR to the new colorshift routine
;
			LDA #$4C
			STA $18AF
			LDA <MOVEBONUS
			STA $18B0
			LDA >MOVEBONUS
			STA $18B1
			LDA #$60
			STA $18F3
;this redirects the object shuffle routine to modified code executing it only for the Atari maze
;
			LDA #$20
			STA $2B85
			LDA <ADVANCETNMT
			STA $2B86
			LDA >ADVANCETNMT
			STA $2B87
;patch routine used when finishing maze to execute code to check for tournament level			

			LDA #$EA
			LDX #12
LOOP0A		STA $1F0B,X
			DEX
			BNE LOOP0A

; patch allowing the "speed increase" routine to decrease the speed control variable at $0206
; below zero, thus allowing correct speed adjustments when returning to lower levels

			LDA #$30
			STA $2FA4
			LDA #$02
			STA $2FA5								
; patch main game delay loop to ignore negative speed numbers, thus avoiding game slowdown.

;            LDA #$EA
;			STA $2514
; change CLI instruction to NOP to allow keyboard interrupts for pause function

 
			LDA <PATCHVBI
			STA $25D8
			LDA >PATCHVBI
			STA $25D9
			LDA #$02
			STA SKCTL
; as VBI is used on the game title screen, the VBI routine for the pause (and possibly map) function
; needs to be inserted at a point that executes after the title screen this is done by redirecting
; a subroutine call

PATCHVVBLKI	LDX #$47
			LDY #$00
			STY $E0
			LDA #$14
			STA $E1
NEXT3		CPY #$FF
			BEQ NEXT2
			LDA ($E0),Y
			CMP #$22
			BNE NEXT1
			INY
			LDA ($E0),Y
			CMP #$02
			BNE NEXT3
			LDA >VVBLKI0
			STA ($E0),Y
			DEY
			LDA <VVBLKI0
			STA ($E0),Y
			INY
			BNE NEXT2		;cannot be 0 as no matches are on an $xxFF address
			
			
NEXT1		CMP #$23
			BNE NEXT2
			INY
			LDA ($E0),Y
			CMP #$02
			BNE NEXT3
			LDA >VVBLKI1
			STA ($E0),Y
			DEY
			LDA <VVBLKI1
			STA ($E0),Y
			
NEXT2		INY
			BNE NEXT3
			INC $E1
			DEX
			BNE NEXT3		

; this changes all instructions referring to $222 and $223 which are needed for the
; VBI to a "safe" location at VVBLKI0/1
; As no other IRQs are used, the IRQ vector instead of the keyboard vector is used
;

;now copy original map data
;
ORIGMAP		LDA MAPTABLELO
			STA $E0
			LDA MAPTABLEHI
			STA $E1
			LDY #$00
LOOP1		LDA $23F2,Y
			STA ($E0),Y
			INY
			BNE LOOP1
;copy FF bytes - segment 1 and 2 of map data - from $23F2 to map data table
			INC $E1
;advance map data table by FF bytes for next segment
LOOP2		LDA $1D43,Y
			STA ($E0),Y
			INY
			CPY #$80
			BNE LOOP2
;copy 80 bytes - segment 3 of map data - from $1D43 to map data table
LOOP2A      LDA $1D43,Y
			BEQ SKIPLUMA
			ORA #$60
SKIPLUMA	STA ($E0),Y
			INY
			BNE LOOP2A			
;copy 80 bytes - segment 4 of map data - from $1DC3 to map data table
;if a colour is stored add generic Atari luminance value of 6 to high nibble to allow
;use of modified original segment 4 data with modified color routine

			INC $E1
;advance map data table "pointer" by FF bytes for next segment
			LDA #$08
			STA ($E0),Y
			INY
;store length of pod room table to first byte
LOOP3		LDA $1EE2,Y
			STA ($E0),Y
			INY
			CPY #$09
			BNE LOOP3			
;copy list of 8 pod rooms - segment 5 of map - to map data table
			LDY #$7D
LOOP4		LDA $24F8-$7D,Y
			STA ($E0),Y
			INY
			CPY #$80
			BNE LOOP4
;copy list of level boundaries - segment 6 of map - to map data table
;this list is always three bytes long
			LDY #$00
			JSR MAPCOPY
;now copy modified map data back into game to have it ready for use when original 
;atari map is played without using SELECT

ORIGINIT	JMP $0486
; continue to original init routine

PATCHVBI	LDX >CHECKKEYS
			LDY <CHECKKEYS
			LDA #$06
			JSR SETVBV
			LDA #$C0
			STA NMIEN
			JMP $30E9			
; turn on VBI and continue to the "hijacked" routine

MAPSELECT	LDA CONSOL
			AND #$04
			BNE MAPSELDONE
;if bit 2 is cleared, OPTION has been pressed
			LDY CURRENTMAP
       		INY
;so increase current level
       		CPY MAXMAP
;check if it it is already above the maximum number of maps
       		BNE INCMAP
;if not, change the map
RESETMAP	LDA <MAPNAMES
			STA MAPNAME
			LDA >MAPNAMES
			STA MAPNAME+1			
			LDY #$00
			BEQ MAPNAMEDONE
;if it is, reset the level to zero and store base address of map names to display list
;
INCMAP		CLC
			LDA MAPNAME
;read address of map name data from display list
			ADC #20
;add 20 (DEC) as all map names are 20 bytes long
			STA MAPNAME
;store it back to display list			
			BCC MAPNAMEDONE
			INC MAPNAME+1
;if carry is set, increase MSB in display list as well			
MAPNAMEDONE	STY CURRENTMAP 
			LDA #$00
			CPY TOURNAMENT
			BNE SKIPTOURNMT 
            TAY
            LDA #$02
SKIPTOURNMT STA ISTOURNMT
; set actual level to zero and set tournament flag byte to 2 (next map in tournament)
; tournament skips Original C64 maze as it is almost identical to Original Atari maze            
CALLMAPCOPY	JSR MAPCOPY
			JSR WAIT
			JSR WAIT							
MAPSELDONE	LDA CONSOL
;this is the LDA CONSOL instruction we replaced when patching the CONSOL read routine in
;the original program.
			RTS
;return to original CONSOL read routine			

CHECKKEYS	LDA SKSTAT
			AND #$04
			BEQ WHICHKEY
; check if a key is still pressed
EXIT		JMP XITVBV
; if not, exit VBLANK
WHICHKEY	LDA KBCODE
			CMP #$21
			BNE EXIT
; check if it is SPACE, if not exit to VBLANK					
PAUSE		LDA #$00
			STA NMIEN
; disable all non-maskable interrupts (i.e. further VBIs and DLIs)

WAITVBI  	LDA VCOUNT
			BPL WAITVBI
; wait for vertical scan to reach bottom of screen

			LDA <PAUSEDLIST
			STA DLISTL
			LDA >PAUSEDLIST
			STA DLISTH
; change display to pause display 

			LDA #$00
			LDY #$03
KILLAUDIO	STA AUDF1,Y
			DEY
			BPL KILLAUDIO
; and silence all four audio channels

PAUSING		LDA TRIG0
			BNE PAUSING
; now wait for trigger press
 
ENDPAUSE	LDA #$B8
			STA DLISTL
			LDA #$35
			STA DLISTH
; change back to game display list

			LDA #$C0
			STA NMIEN
; enable interrupts

			STA HITCLR
; clear collision detection (to avoid spurious collisions of player with Pause text that may
; occur because player remains on-screeen during pause (as I have no way of determining it's position
; and therefore could only make it disappear by copying all player data to a safe location and back).

			STA SKRES
; reset keyboard scan
			LDX #$05
			JSR WAIT1
			BEQ EXIT
; wait a bit before game resumes
			
; MAPCOPY copies the map for the selected game (Y register) into game
MAPCOPY		TYA
			PHA
			LDA MAPTABLELO,Y
			STA $E0
			LDA MAPTABLEHI,Y
			STA $E1
			LDY #$00
LOOP5		LDA ($E0),Y
			STA $23F2,Y
			INY
			BNE LOOP5
;copy FF bytes - segment 1 and 2 of map data - to $23F2
			INC $E1
;advance map data table "pointer" by FF bytes for next segment
LOOP6		LDA ($E0),Y
			STA $1D43,Y
			INY
			BNE LOOP6
;copy FF bytes - segment 3 and 4 of map data - to $1D43
			INC $E1
;advance map data table "pointer" by FF bytes for next segment
			LDY #$00
			LDA ($E0),Y
			STA $1FEF,Y
;store length of pod room table into code that loops through pod room table
			LDY #$7D
LOOP7		LDA ($E0),Y
			STA $24F8-$7D,Y
			INY
			CPY #$80
			BNE LOOP7
;copy three bytes of segment 5 (level boundaries) to $24F8
			LDA $E1
			CLC
			INC $E0
			ADC #$00
			STA $1FF7
			LDA $E0
			STA $1FF6
;store address of maptable pod room data + 1 to code that loops through pod room table
;	
			PLA
			ASL
			ASL
			ASL
			ASL
			ORA #$0E
			TAY
;Y now contains number of maze x 16 which is equal to start of game screen map name
			LDX #$0F
LOOP9		LDA MAPNAME0,Y
			STA MAPLEGEND+4,X
			DEY
			DEX
			BNE LOOP9
;copy 16 characters from table of game screen map display names to screen memory for
;last line of screen
			RTS

WAIT		LDX #$FF
WAIT1		LDY #$FF
WAIT2		DEY
			BNE WAIT2
			DEX
			BNE WAIT1	
			RTS		
;this routine counts to FFFF
;it can be used for shorter waits by loading X with a lower value and jumping to WAIT1
;
SHIFTCOLOR	CLC
			ASL
			ADC #$00
			ASL
			ADC #$00
			ASL
			ADC #$00
			ASL
			ADC #$00
			RTS
; the original Shamus routine uses just the lower nibble of map segment 3 data 

MOVEBONUS	LDA CURRENTMAP
            BEQ SHIFTBONUS
			LDA ISTOURNMT
			CMP #$02
			BEQ SHIFTBONUS
EXITSHIFT   JMP $18FE
; The Atari game shifts the contents of some chambers around whenever a new game is selected.
; This does not work for some C64 mazes as it shifts objects into corridor rooms.
; This code executes the object shift routine when playing the original Atari maze and bypasses
; it when playing a C64 maze.

SHIFTBONUS	LDY #$04
LOOP8		DEY
			CPY #$FF
			BEQ	EXITSHIFT
			LDA $D20A		;RANDOM
			AND #$01
			BEQ LOOP8
			JSR $18BD
			JMP LOOP8	
; this is a functional copy of the code originally at $18AF using the original map shift code
; as a subroutine.

ADVANCETNMT	LDY ISTOURNMT
			BEQ EXITADVANCE
;if tournament flag is zero, use speed value already in ACC and return to game
;
			INC $0202
;add one life
            LDA #$05
;this is the default speed for the next maze, one "step" faster than normal game start, 
; same as second time round for normal Atari game
            CPY TOURNAMENT
;check if next level actually exists. If not, player has made it through all mazes.
            BNE ADVANCEMAP
; if finished with last maze, extra effect?
			LDX #$01
			STX ISTOURNMT
;set tournament flag to 1 so it will be increased to two during normal ADVANCEMAP routine
			
			TAY
			DEY
			DEY
			TYA
; if the player has made it through all mazes, increase the speed for the next attempt to $04
			LDY #$00
; and set the next level to be loaded to the first level
ADVANCEMAP	PHA	
; save the speed to be played next
			INC ISTOURNMT
;advance tournament flag to next level in tournament
			JSR MAPCOPY
; Y already contains next level to be played in tournament mode, (or zero if starting at first
; maze agein. MAPCOPY puts maze data in place
; if finished with last maze, extra effect?
;
			PLA
; recall the  saved speed value for the next level 

EXITADVANCE	STA $0206
			RTS
;store either game calculated or new speed into $0206 (games speed variable) and return			

VVBLKI0		.BY $00
VVBLKI1		.BY $00

MENUDLIST	.BY $46
MAPNAME		.BY <MAPNAMES
			.BY >MAPNAMES
			.BY $70
			.BY $41 $3C $0C
; adds extra line to show name of selected map to menu display list, then jumps back
; to original display list

GAMEDLIST	.BY $46
MAPNAMEDISP	.BY <MAPLEGEND
			.BY >MAPLEGEND
			.BY $41 $B8 $35
; add extra mode 6 line to in-game display list to show actual map

PAUSEDLIST	.BY $70 $70 $70 $70 $70 $70 $70 $70 $70 $70 $70 $70 $70 $70
			.BY $47 
			.BY <PAUSETEXT
			.BY >PAUSETEXT
			.BY $70
			.BY $06
			.BY $41
			.BY <PAUSEDLIST
			.BY >PAUSEDLIST

PAUSETEXT	.SB "       PAUSED       " 
			.SB "  FIRE TO CONTINUE  "

SCRLTXTBEG	.SB "by william mataga    "
			.SB "ORIGINALLY PUBLISHED BY SYNAPSE SOFTWARE  1982    "
			.SB "COPYRIGHT  ASSUMED  TO  BE  WITH  CATHRYN MATAGA  2017    "  
			.SB +$80 "C64 LEVELS BY JACK L. THORNTON, JR.    "
SLX			.SB "ported to atari by slx"*
			.SB "  "
			.BY $D2 $D0 $D1 $D7
			.SB "    "
SCRLTXTWRAP	.SB "by william mataga    "
SCRLTXTEND		
CURRENTMAP	.BY $00
MAXMAP		.BY $07
TOURNAMENT	.BY $06
;number of selection that results in tournament mode
ISTOURNMT	.BY $00
;this is a flag that indicates if a tournament (playing one maze after another)
;is in progress. $00 means no tournament mode, other value is next maze to be played
;
LASTLEVEL	.BY $00
MAPTABLE
MAPTABLELO	.BY <(MAPDATA)
			.BY <(MAPDATA+640)
			.BY <(MAPDATA+1280)
			.BY <(MAPDATA+1920)
			.BY <(MAPDATA+2560)
			.BY <(MAPDATA+3200)
MAPTABLEHI	.BY >(MAPDATA)
			.BY >(MAPDATA+640)
			.BY >(MAPDATA+1280)
			.BY >(MAPDATA+1920)
			.BY >(MAPDATA+2560)
			.BY >(MAPDATA+3200)
MAPNAMTBLLO	.BY <(MAP0)
			.BY <(MAP1)
			.BY <(MAP2)
			.BY <(MAP3)
			.BY <(MAP4)
			.BY <(MAP5)
			.BY <(MAP6)	
MAPNAMTBLHI	.BY >(MAP0)
			.BY >(MAP1)
			.BY >(MAP2)
			.BY >(MAP3)
			.BY >(MAP4)
			.BY >(MAP5)
			.BY >(MAP6)		
MAPNAMES
MAP0		.SB " ORIGINAL ATARI MAP ";*
MAP1		.SB "  original C64 map  "*
MAP2		.SB "       holmes       "*
MAP3		.SB "       cluseau      "*
MAP4		.SB "       marlowe      "*
MAP5		.SB "        bond        "*
MAP6		.SB "     TOURNAMENT     "*
;
;
MAPLEGEND	.SB "MAP:                "
MAPNAME0	.SB "ORIGINAL ATARI  "
MAPNAME1	.SB "ORIGINAL C64    "
MAPNAME2	.SB "HOLMES          "
MAPNAME3	.SB	"CLUSEAU         "
MAPNAME4	.SB "MARLOWE         "
MAPNAME5	.SB "BOND            "

COLORSHIFTCODE
			.BY $20						; JSR
			.WO SHIFTCOLOR
			.BY $EA $EA $EA				; 3x NOP

;			org *+$100-<*
;to ease debugging and analysis of map, start map data at next page boundary
			
MAPDATA		.ds 640
; reserve 640 bytes to cover original Atari map for later re-use

			ins "SHAM_A8.MAP.dat"
;insert converted C64 map data

			run $7000 
; this is the original game run address (I assume that the code at $7000 was added by whomever
; cracked the original disc game and corrected the title music player routine for the Homesoft
; version.)

 
  